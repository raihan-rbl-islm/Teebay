/**
 * Type Definitions for Teebay Server
 * ----------------------------------------------------------------------------
 * Centralized type definitions for better type safety and code maintainability.
 */

import { Request } from 'express';
import { Category, RentType, TransactionType } from '@prisma/client';

/**
 * Extended Express Request with authenticated user context
 */
export interface AuthenticatedRequest extends Request {
  userId?: number;
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

/**
 * GraphQL Context structure
 */
export interface GraphQLContext {
  req: AuthenticatedRequest;
  userId?: number;
}

/**
 * Register Input (matches GraphQL schema)
 */
export interface RegisterInput {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phoneNumber: string;
  password: string;
}

/**
 * Login Input (matches GraphQL schema)
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Create Product Input (matches GraphQL schema)
 */
export interface CreateProductInput {
  title: string;
  description: string;
  categories: Category[];
  price?: number | null;
  rentPrice?: number | null;
  rentType?: RentType | null;
}

/**
 * Update Product Input (matches GraphQL schema)
 */
export interface UpdateProductInput {
  title?: string;
  description?: string;
  categories?: Category[];
  price?: number | null;
  rentPrice?: number | null;
  rentType?: RentType | null;
  isSold?: boolean;
}

/**
 * Rent Input (matches GraphQL schema)
 */
export interface RentInput {
  productId: number;
  startDate: string;
  endDate: string;
}

/**
 * Transaction History Filter Options
 */
export type TransactionFilter = 'BOUGHT' | 'SOLD' | 'BORROWED' | 'LENT';

/**
 * Transaction Filter Mapping
 * 
 * Maps filter strings to Prisma where clause structures
 */
export interface TransactionFilterMap {
  BOUGHT: {
    userId: number;
    type: 'BUY';
  };
  SOLD: {
    product: { ownerId: number };
    type: 'BUY';
  };
  BORROWED: {
    userId: number;
    type: 'RENT';
  };
  LENT: {
    product: { ownerId: number };
    type: 'RENT';
  };
}
