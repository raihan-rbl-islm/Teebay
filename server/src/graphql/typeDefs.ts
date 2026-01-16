export const typeDefs = `#graphql
  enum Category {
    ELECTRONICS
    FURNITURE
    HOME_APPLIANCES
    SPORTING_GOODS
    OUTDOOR
    TOYS
  }

  type User {
    id: Int!
    firstName: String!
    lastName: String!
    email: String!
    products: [Product]
    transactions: [Transaction]
  }

  type Product {
    id: Int!
    title: String!
    description: String!
    price: Float!
    rentPrice: Float!
    rentType: String!
    categories: [Category]!
    ownerId: Int!
    owner: User
    isSold: Boolean
    transactions: [Transaction]
  }

  type Transaction {
    id: Int!
    type: String!      # "BUY" or "RENT"
    productId: Int!
    product: Product
    userId: Int!       # The Buyer/Renter
    user: User
    startDate: String  # For Rentals
    endDate: String    # For Rentals
    createdAt: String
  }

  type Query {
    hello: String
    users: [User]
    products: [Product]
    product(id: Int!): Product
    myTransactions(userId: Int!): [Transaction] 
  }

  type Mutation {
    # Auth
    register(firstName: String!, lastName: String!, email: String!, password: String!, address: String, phoneNumber: String): User
    login(email: String!, password: String!): User

    # Product
    createProduct(title: String!, description: String!, price: Float!, rentPrice: Float!, rentType: String!, categories: [Category]!, ownerId: Int!): Product
    deleteProduct(id: Int!): Boolean

    # Transactions (The New Stuff)
    buyProduct(productId: Int!, userId: Int!): Transaction
    
    rentProduct(
      productId: Int!, 
      userId: Int!, 
      startDate: String!, 
      endDate: String!
    ): Transaction
  }
`;