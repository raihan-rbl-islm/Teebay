/**
 * Query Resolvers
 * ----------------------------------------------------------------------------
 * Handles all GraphQL query operations (read operations).
 * 
 * This module contains resolvers for:
 * - System health checks
 * - Product queries (user's products, marketplace, single product)
 * - Transaction history queries
 */

import { PrismaClient, TransactionType } from '@prisma/client';
import { GraphQLContext } from '../types';
import { getUserIdFromRequest } from '../utils/auth';
import { AuthenticationError, NotFoundError } from '../utils/errors';

// Initialize Prisma Client for database operations
const prisma = new PrismaClient();

/**
 * Query Resolvers Export
 * ----------------------------------------------------------------------------
 * Exports all query resolvers as a single object matching GraphQL schema
 */
export const Query = {
  /**
   * Health check endpoint
   * Used to verify that the GraphQL server is running and responsive
   * 
   * @returns Status message string
   */
  hello: (): string => {
    return 'Teebay Server is Online';
  },

  /**
   * Fetches all products owned by the authenticated user
   * 
   * Used for the Dashboard page to display the user's product listings.
   * Excludes sold products (products that have been purchased).
   * Products are ordered by most recently posted first.
   * 
   * @param _ - Parent resolver (unused in root queries)
   * @param __ - Query arguments (unused for this query)
   * @param context - GraphQL context containing Express request
   * @returns Array of Product objects owned by the authenticated user (excluding sold products)
   * @throws AuthenticationError if user is not authenticated
   */
  myProducts: async (
    _: unknown,
    __: unknown,
    { req }: GraphQLContext
  ) => {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      throw new AuthenticationError('You must be logged in to view your products');
    }

    return prisma.product.findMany({
      where: { 
        ownerId: userId,
        isSold: false, // Exclude sold products from "my products"
      },
      orderBy: { datePosted: 'desc' },
      include: { owner: true },
    });
  },

  /**
   * Fetches all products from other users (marketplace view)
   * 
   * Used for the "All Products" page to display available products for purchase/rental.
   * Automatically excludes:
   * - Products owned by the current user (if authenticated)
   * - Products that are already sold
   * 
   * Products are ordered by most recently posted first.
   * 
   * @param _ - Parent resolver (unused in root queries)
   * @param __ - Query arguments (unused for this query)
   * @param context - GraphQL context containing Express request
   * @returns Array of Product objects available in the marketplace
   */
  allProducts: async (
    _: unknown,
    __: unknown,
    { req }: GraphQLContext
  ) => {
    const userId = getUserIdFromRequest(req);

    return prisma.product.findMany({
      where: {
        isSold: false,
        // Exclude current user's products if authenticated
        ...(userId ? { ownerId: { not: userId } } : {}),
      },
      orderBy: { datePosted: 'desc' },
      include: { owner: true },
    });
  },

  /**
   * Fetches a single product by ID and increments view count
   * 
   * Used for the Product Details page. Automatically tracks product views
   * for analytics purposes. View count is NOT incremented if the viewer
   * is the product owner (to prevent self-inflation of metrics).
   * 
   * @param _ - Parent resolver (unused in root queries)
   * @param args - Query arguments containing product ID
   * @param context - GraphQL context containing Express request
   * @returns Product object with owner information
   * @throws NotFoundError if product doesn't exist
   */
  product: async (
    _: unknown,
    { id }: { id: number },
    { req }: GraphQLContext
  ) => {
    const productId = Number(id);
    const currentUserId = getUserIdFromRequest(req);

    // Fetch the product first to check ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { owner: true },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    // Only increment views if viewer is not the owner
    // This prevents owners from inflating their own view counts
    if (currentUserId && product.ownerId === currentUserId) {
      return product;
    }

    // Increment view count for non-owners (guests or other users)
    return prisma.product.update({
      where: { id: productId },
      data: { views: { increment: 1 } },
      include: { owner: true },
    });
  },

  /**
   * Fetches transaction history filtered by type
   * 
   * Used for the Transactions page to display user's transaction history.
   * Supports four filter types:
   * - BOUGHT: Products the user has purchased
   * - SOLD: Products the user has sold to others
   * - BORROWED: Products the user has rented
   * - LENT: Products the user has rented out to others
   * 
   * Transactions are ordered by most recent first.
   * 
   * @param _ - Parent resolver (unused in root queries)
   * @param args - Query arguments containing filter type (BOUGHT, SOLD, BORROWED, LENT)
   * @param context - GraphQL context containing Express request
   * @returns Array of Transaction objects matching the filter
   * @throws AuthenticationError if user is not authenticated
   */
  myTransactionHistory: async (
    _: unknown,
    { filter }: { filter: string },
    { req }: GraphQLContext
  ) => {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      throw new AuthenticationError('You must be logged in to view transaction history');
    }

    // Map filter strings to Prisma where clauses
    // Each filter represents a different perspective on transactions
    const filterMap: Record<string, any> = {
      BOUGHT: {
        userId: userId,
        type: TransactionType.BUY,
      },
      SOLD: {
        product: { ownerId: userId },
        type: TransactionType.BUY,
      },
      BORROWED: {
        userId: userId,
        type: TransactionType.RENT,
      },
      LENT: {
        product: { ownerId: userId },
        type: TransactionType.RENT,
      },
    };

    const where = filterMap[filter];
    
    // Return empty array for invalid filter types
    if (!where) {
      return [];
    }

    try {
      return prisma.transaction.findMany({
        where,
        include: { product: { include: { owner: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      // If error is due to missing columns (migration not run), return empty array
      // This allows the app to work before migration is run
      if (error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.warn('Transaction pricing columns not found. Please run migration: npx prisma migrate dev');
        return [];
      }
      throw error;
    }
  },

  /**
   * Checks if the current user has a transaction for a specific product
   * 
   * Used to determine if user bought/rented a product and show transaction-specific information.
   * 
   * @param _ - Parent resolver (unused in root queries)
   * @param args - Query arguments containing product ID
   * @param context - GraphQL context containing Express request
   * @returns Transaction object if user has transaction for this product, null otherwise
   * @throws AuthenticationError if user is not authenticated
   */
  myTransactionForProduct: async (
    _: unknown,
    { productId }: { productId: number },
    { req }: GraphQLContext
  ) => {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      throw new AuthenticationError('You must be logged in to check transaction status');
    }

    const pid = Number(productId);

    // Find transaction where user bought or rented this product
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId,
        productId: pid,
      },
      include: { product: { include: { owner: true } } },
      orderBy: { createdAt: 'desc' }, // Get most recent transaction
    });

    return transaction;
  },
};
