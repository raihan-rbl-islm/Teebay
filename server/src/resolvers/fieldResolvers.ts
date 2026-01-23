/**
 * Field Resolvers
 * ----------------------------------------------------------------------------
 * Handles field-level resolution for GraphQL types.
 * 
 * These resolvers are used when:
 * - A field requires additional computation or transformation
 * - A field needs to fetch related data from the database
 * - Date serialization is needed (GraphQL doesn't have native Date type)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Product Field Resolvers
 * ----------------------------------------------------------------------------
 * Resolvers for fields on the Product type that require special handling
 */

/**
 * Converts Product.datePosted from Date to ISO string
 * GraphQL doesn't have a native Date type, so we serialize dates as strings
 * 
 * @param parent - The Product object from the parent resolver
 * @returns ISO string representation of the date
 */
export const Product = {
  datePosted: (parent: { datePosted: Date }): string => {
    return parent.datePosted.toISOString();
  },

  /**
   * Fetches the owner (User) of a product
   * This is a relation field that requires a database query
   * 
   * @param parent - The Product object containing ownerId
   * @returns User object or null if not found
   */
  owner: async (parent: { ownerId: number }) => {
    return prisma.user.findUnique({
      where: { id: parent.ownerId },
    });
  },
};

/**
 * Transaction Field Resolvers
 * ----------------------------------------------------------------------------
 * Resolvers for fields on the Transaction type that require special handling
 */

/**
 * Converts Transaction.createdAt from Date to ISO string
 * 
 * @param parent - The Transaction object from the parent resolver
 * @returns ISO string representation of the creation date
 */
export const Transaction = {
  createdAt: (parent: { createdAt: Date }): string => {
    return parent.createdAt.toISOString();
  },

  /**
   * Converts Transaction.startDate from Date to ISO string (for rentals)
   * Returns null if startDate is not set (purchases don't have start dates)
   * 
   * @param parent - The Transaction object
   * @returns ISO string representation of start date, or null
   */
  startDate: (parent: { startDate: Date | null }): string | null => {
    return parent.startDate ? parent.startDate.toISOString() : null;
  },

  /**
   * Converts Transaction.endDate from Date to ISO string (for rentals)
   * Returns null if endDate is not set (purchases don't have end dates)
   * 
   * @param parent - The Transaction object
   * @returns ISO string representation of end date, or null
   */
  endDate: (parent: { endDate: Date | null }): string | null => {
    return parent.endDate ? parent.endDate.toISOString() : null;
  },

  /**
   * Fetches the product associated with a transaction
   * This is a relation field that requires a database query
   * 
   * @param parent - The Transaction object containing productId
   * @returns Product object with owner information, or null if not found
   */
  product: async (parent: { productId: number }) => {
    return prisma.product.findUnique({
      where: { id: parent.productId },
      include: { owner: true },
    });
  },

  /**
   * Returns the transaction-specific purchase price
   * Only present for BUY transactions
   * 
   * @param parent - The Transaction object
   * @returns Purchase price at time of transaction, or null
   */
  transactionPrice: (parent: any): number | null => {
    // Handle both undefined (field doesn't exist yet) and null (field exists but is null)
    return parent.transactionPrice ?? null;
  },

  /**
   * Returns the transaction-specific rental price
   * Only present for RENT transactions
   * 
   * @param parent - The Transaction object
   * @returns Rental price at time of transaction, or null
   */
  transactionRentPrice: (parent: any): number | null => {
    // Handle both undefined (field doesn't exist yet) and null (field exists but is null)
    return parent.transactionRentPrice ?? null;
  },

  /**
   * Returns the transaction-specific rental type
   * Only present for RENT transactions
   * 
   * @param parent - The Transaction object
   * @returns Rental type at time of transaction, or null
   */
  transactionRentType: (parent: any): string | null => {
    // Handle both undefined (field doesn't exist yet) and null (field exists but is null)
    return parent.transactionRentType ?? null;
  },
};
