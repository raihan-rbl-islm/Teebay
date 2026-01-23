/**
 * Mutation Resolvers
 * ----------------------------------------------------------------------------
 * Handles all GraphQL mutation operations (write operations).
 * 
 * This module contains resolvers for:
 * - User authentication (register, login, logout)
 * - Product management (create, update, delete)
 * - Transaction operations (buy, rent)
 */

import { PrismaClient, TransactionType } from '@prisma/client';
import { GraphQLContext } from '../types';
import { getUserIdFromRequest, generateToken } from '../utils/auth';
import { AuthenticationError, AuthorizationError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { RegisterInput, LoginInput, CreateProductInput, UpdateProductInput, RentInput } from '../types';

const prisma = new PrismaClient();

/**
 * Authentication Mutations
 * ----------------------------------------------------------------------------
 */

/**
 * Registers a new user in the system
 * 
 * @param _ - Parent resolver (unused)
 * @param args - Mutation arguments containing registration input
 * @returns AuthPayload with JWT token and user data
 * @throws ConflictError if user with email already exists
 * @throws ValidationError if input validation fails
 */
export const register = async (
  _: unknown,
  { input }: { input: RegisterInput }
) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ConflictError('User already exists with this email');
  }

  // Create new user (password stored as plain text per requirements)
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      address: input.address,
      phoneNumber: input.phoneNumber,
      password: input.password, // Plain text storage (per project requirements)
    },
  });

  // Generate JWT token
  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address,
      phoneNumber: user.phoneNumber,
    },
  };
};

/**
 * Authenticates a user and returns a JWT token
 * 
 * @param _ - Parent resolver (unused)
 * @param args - Mutation arguments containing login credentials
 * @returns AuthPayload with JWT token and user data
 * @throws AuthenticationError if credentials are invalid
 */
export const login = async (
  _: unknown,
  { input }: { input: LoginInput }
) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Verify user exists and password matches (plain text comparison per requirements)
  if (!user || user.password !== input.password) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address,
      phoneNumber: user.phoneNumber,
    },
  };
};

/**
 * Logs out the current user (client-side token removal)
 * This is a placeholder mutation for future server-side session management
 * 
 * @returns Always returns true
 */
export const logout = async (): Promise<boolean> => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // This mutation exists for API consistency and future session management
  return true;
};

/**
 * Product Management Mutations
 * ----------------------------------------------------------------------------
 */

/**
 * Creates a new product listing
 * 
 * @param _ - Parent resolver (unused)
 * @param args - Mutation arguments containing product input
 * @param context - GraphQL context containing request
 * @returns Created product object
 * @throws AuthenticationError if user is not authenticated
 * @throws ValidationError if product data is invalid
 */
export const createProduct = async (
  _: unknown,
  { input }: { input: CreateProductInput },
  { req }: GraphQLContext
) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    throw new AuthenticationError('You must be logged in to create a product');
  }

  // Validate that at least one pricing option is provided
  if (!input.price && !input.rentPrice) {
    throw new ValidationError('Product must have either a purchase price or rental price');
  }

  // Validate that if rentPrice is provided, rentType must also be provided
  if (input.rentPrice && !input.rentType) {
    throw new ValidationError('Rental type is required when rental price is set');
  }

  // Create product with authenticated user as owner
  const product = await prisma.product.create({
    data: {
      title: input.title,
      description: input.description,
      categories: input.categories,
      price: input.price ?? null,
      rentPrice: input.rentPrice ?? null,
      rentType: input.rentType ?? null,
      ownerId: userId,
    },
    include: { owner: true },
  });

  return product;
};

/**
 * Updates an existing product listing
 * Only the product owner can update their own products
 * 
 * @param _ - Parent resolver (unused)
 * @param args - Mutation arguments containing product ID and update input
 * @param context - GraphQL context containing request
 * @returns Updated product object
 * @throws AuthenticationError if user is not authenticated
 * @throws NotFoundError if product doesn't exist
 * @throws AuthorizationError if user is not the product owner
 */
export const updateProduct = async (
  _: unknown,
  { id, input }: { id: number; input: UpdateProductInput },
  { req }: GraphQLContext
) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    throw new AuthenticationError('You must be logged in to update a product');
  }

  const productId = Number(id);

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  // Verify user owns the product
  if (product.ownerId !== userId) {
    throw new AuthorizationError('You can only update your own products');
  }

  // Calculate what the final values will be after update
  const finalPrice = input.price !== undefined ? input.price : product.price;
  const finalRentPrice = input.rentPrice !== undefined ? input.rentPrice : product.rentPrice;
  const finalRentType = input.rentType !== undefined ? input.rentType : product.rentType;

  // Validate that at least one pricing option remains after update
  if (!finalPrice && !finalRentPrice) {
    throw new ValidationError('Product must have either a purchase price or rental price');
  }

  // Validate that if rentPrice is set, rentType must also be set
  if (finalRentPrice && !finalRentType) {
    throw new ValidationError('Rental type is required when rental price is set');
  }

  // Update product
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.categories !== undefined && { categories: input.categories }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.rentPrice !== undefined && { rentPrice: input.rentPrice }),
      ...(input.rentType !== undefined && { rentType: input.rentType }),
      ...(input.isSold !== undefined && { isSold: input.isSold }),
    },
    include: { owner: true },
  });

  return updatedProduct;
};

/**
 * Deletes a product listing
 * Only the product owner can delete their own products
 * 
 * @param _ - Parent resolver (unused)
 * @param args - Mutation arguments containing product ID
 * @param context - GraphQL context containing request
 * @returns True if deletion was successful
 * @throws AuthenticationError if user is not authenticated
 * @throws NotFoundError if product doesn't exist
 * @throws AuthorizationError if user is not the product owner
 */
export const deleteProduct = async (
  _: unknown,
  { id }: { id: number },
  { req }: GraphQLContext
) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    throw new AuthenticationError('You must be logged in to delete a product');
  }

  const productId = Number(id);

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  // Verify user owns the product
  if (product.ownerId !== userId) {
    throw new AuthorizationError('You can only delete your own products');
  }

  // Delete product (cascade deletes related transactions)
  await prisma.product.delete({
    where: { id: productId },
  });

  return true;
};

/**
 * Transaction Mutations
 * ----------------------------------------------------------------------------
 */

/**
 * Purchases a product (marks it as sold and creates a transaction record)
 * 
 * @param _ - Parent resolver (unused)
 * @param args - Mutation arguments containing product ID
 * @param context - GraphQL context containing request
 * @returns True if purchase was successful
 * @throws AuthenticationError if user is not authenticated
 * @throws NotFoundError if product doesn't exist
 * @throws ConflictError if product is already sold or user is the owner
 */
export const buyProduct = async (
  _: unknown,
  { productId }: { productId: number },
  { req }: GraphQLContext
) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    throw new AuthenticationError('You must be logged in to buy a product');
  }

  const pid = Number(productId);

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Fetch product with lock to prevent race conditions
    const product = await tx.product.findUnique({
      where: { id: pid },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    if (product.isSold) {
      throw new ConflictError('Product is already sold');
    }

    if (product.ownerId === userId) {
      throw new ConflictError('Cannot buy your own product');
    }

    // Validate that product has a purchase price set
    if (!product.price) {
      throw new ValidationError('Product does not have a purchase price set');
    }

    // Check for active rentals (rentals that haven't ended yet)
    const now = new Date();
    const activeRentals = await tx.transaction.findMany({
      where: {
        productId: pid,
        type: TransactionType.RENT,
        endDate: {
          gte: now, // Rental hasn't ended yet
        },
      },
    });

    if (activeRentals.length > 0) {
      throw new ConflictError('Cannot buy product while it is currently rented. Please try again after the rental period ends.');
    }

    // Mark product as sold
    await tx.product.update({
      where: { id: pid },
      data: { isSold: true },
    });

    // Create transaction record with transaction-specific pricing
    // Using type assertion to handle new fields that may not exist in Prisma types yet
    await tx.transaction.create({
      data: {
        type: TransactionType.BUY,
        userId,
        productId: pid,
        ...(product.price && { transactionPrice: product.price }), // Store price at time of purchase
      } as any, // Temporary type assertion until Prisma client is regenerated
    });
  });

  return true;
};

/**
 * Rents a product (creates a rental transaction record)
 * 
 * @param _ - Parent resolver (unused)
 * @param args - Mutation arguments containing rental input
 * @param context - GraphQL context containing request
 * @returns True if rental was successful
 * @throws AuthenticationError if user is not authenticated
 * @throws ValidationError if date range is invalid
 */
export const rentProduct = async (
  _: unknown,
  { input }: { input: RentInput },
  { req }: GraphQLContext
) => {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    throw new AuthenticationError('You must be logged in to rent a product');
  }

  const productId = Number(input.productId);

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  // Validate that product is not sold
  if (product.isSold) {
    throw new ConflictError('Cannot rent a product that is already sold');
  }

  // Validate that user is not trying to rent their own product
  if (product.ownerId === userId) {
    throw new ConflictError('Cannot rent your own product');
  }

  // Validate that product has rental options configured
  if (!product.rentPrice || !product.rentType) {
    throw new ValidationError('Product does not have rental options configured');
  }

  // Validate date range
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  if (endDate <= startDate) {
    throw new ValidationError('End date must be after start date');
  }

  // Validate that start date is not in the past
  const now = new Date();
  if (startDate < now) {
    throw new ValidationError('Start date cannot be in the past');
  }

  // Check for rental conflicts (overlapping rental periods)
  const conflictingRentals = await prisma.transaction.findMany({
    where: {
      productId,
      type: TransactionType.RENT,
      OR: [
        // New rental starts during an existing rental
        {
          startDate: { lte: startDate },
          endDate: { gte: startDate },
        },
        // New rental ends during an existing rental
        {
          startDate: { lte: endDate },
          endDate: { gte: endDate },
        },
        // New rental completely encompasses an existing rental
        {
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
      ],
    },
  });

  if (conflictingRentals.length > 0) {
    throw new ConflictError(
      `Product is already rented during this period. Please choose a different date range.`
    );
  }

  // Create rental transaction with transaction-specific pricing
  // Using type assertion to handle new fields that may not exist in Prisma types yet
  await prisma.transaction.create({
    data: {
      type: TransactionType.RENT,
      userId,
      productId,
      startDate,
      endDate,
      ...(product.rentPrice && { transactionRentPrice: product.rentPrice }), // Store rent price at time of rental
      ...(product.rentType && { transactionRentType: product.rentType }), // Store rent type at time of rental
    } as any, // Temporary type assertion until Prisma client is regenerated
  });

  return true;
};

/**
 * Mutation Resolvers Export
 * ----------------------------------------------------------------------------
 * Exports all mutation resolvers as a single object matching GraphQL schema
 */
export const Mutation = {
  // Authentication
  register,
  login,
  logout,

  // Product Management
  createProduct,
  updateProduct,
  deleteProduct,

  // Transactions
  buyProduct,
  rentProduct,
};
