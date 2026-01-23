/**
 * GraphQL Type Definitions
 * ----------------------------------------------------------------------------
 * Defines the complete GraphQL schema for the Teebay API.
 * 
 * This schema includes:
 * - Type definitions for User, Product, and Transaction
 * - Input types for mutations
 * - Enums for Category, RentType, and TransactionType
 * - Query and Mutation operations
 * 
 * Note: Enum values must match the Prisma schema exactly to ensure
 * type safety and consistency between the database and API layer.
 */

export const typeDefs = `#graphql
  # ---------------------------------------------------------
  # ENUMS (Must match Prisma Schema exactly)
  # ---------------------------------------------------------
  enum Category {
    ELECTRONICS
    FURNITURE
    HOME_APPLIANCES
    SPORTING_GOODS
    OUTDOOR
    TOYS
  }

  enum RentType {
    PER_HOUR
    PER_DAY
  }

  # ---------------------------------------------------------
  # OBJECT TYPES (The data we return to the Frontend)
  # ---------------------------------------------------------
  
  type User {
    id: Int!
    firstName: String!
    lastName: String!
    email: String!
    address: String!
    phoneNumber: String!
  }

  type Product {
    id: Int!
    title: String!
    description: String!
    price: Float
    rentPrice: Float
    rentType: RentType
    categories: [Category!]!
    views: Int!
    datePosted: String! # Dates are serialized as Strings in GraphQL
    isSold: Boolean!
    ownerId: Int!
    owner: User!
  }

  # Represents an entry in the "Bought/Sold/Borrowed/Lent" history tabs
  type Transaction {
    id: Int!
    type: String!       # "BUY" or "RENT"
    product: Product!   # The full product details associated with this transaction
    startDate: String   # Only present for Rentals
    endDate: String     # Only present for Rentals
    createdAt: String!
    # Transaction-specific pricing (snapshot at time of transaction)
    transactionPrice: Float      # Price paid for purchase (if type == BUY)
    transactionRentPrice: Float # Rent price at time of rental (if type == RENT)
    transactionRentType: RentType # Rent type at time of rental (if type == RENT)
  }

  # Standard response for Auth actions
  type AuthPayload {
    token: String!
    user: User!
  }

  # ---------------------------------------------------------
  # INPUTS (Data sent from Frontend forms)
  # ---------------------------------------------------------

  input RegisterInput {
    firstName: String!
    lastName: String!
    address: String!
    email: String!
    phoneNumber: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateProductInput {
    title: String!
    description: String!
    categories: [Category!]!
    price: Float
    rentPrice: Float
    rentType: RentType
  }

  input UpdateProductInput {
    title: String
    description: String
    categories: [Category!]
    price: Float
    rentPrice: Float
    rentType: RentType
    isSold: Boolean
  }

  input RentInput {
    productId: Int!
    startDate: String!
    endDate: String!
  }

  # ---------------------------------------------------------
  # OPERATIONS
  # ---------------------------------------------------------

  type Query {
    # System Check
    hello: String
    
    # Dashboard: Products created by the logged-in user
    myProducts: [Product!]!
    
    # Marketplace: Products created by OTHER people (excluding my own)
    allProducts: [Product!]!
    
    # Single Product Details (Increments view count on fetch)
    product(id: Int!): Product
    
    # Check if current user has a transaction for this product
    # Returns transaction if user bought/rented this product, null otherwise
    myTransactionForProduct(productId: Int!): Transaction
    
    # History Tabs: Returns list based on the selected filter
    # filter options: "BOUGHT", "SOLD", "BORROWED", "LENT"
    myTransactionHistory(filter: String!): [Transaction!]!
  }

  type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!

    # Product Management (CRUD)
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: Int!, input: UpdateProductInput!): Product!
    deleteProduct(id: Int!): Boolean!

    # Transaction Actions
    buyProduct(productId: Int!): Boolean!
    rentProduct(input: RentInput!): Boolean!
  }
`;