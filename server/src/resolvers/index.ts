/**
 * GraphQL Resolvers
 * ----------------------------------------------------------------------------
 * Main resolver file that aggregates and exports all resolvers.
 * 
 * This module follows a modular architecture:
 * - queries.ts: All GraphQL query resolvers
 * - mutations.ts: All GraphQL mutation resolvers
 * - fieldResolvers.ts: Field-level resolvers for complex types
 * 
 * The resolvers object structure matches the GraphQL schema defined in typeDefs.ts
 */

import { Query } from './queries';
import { Mutation } from './mutations';
import { Product, Transaction } from './fieldResolvers';

/**
 * Complete resolver map for Apollo Server
 * 
 * Structure matches the GraphQL schema:
 * - Query: Root query operations
 * - Mutation: Root mutation operations
 * - Product: Field resolvers for Product type
 * - Transaction: Field resolvers for Transaction type
 */
export const resolvers = {
  Query,
  Mutation,
  Product,
  Transaction,
};
