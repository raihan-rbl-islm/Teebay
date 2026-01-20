import { PrismaClient, TransactionType } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * CONFIGURATION
 * ------------------------------------------------------------------
 * "unsafe_secret_key" is used as a fallback to ensure the application
 * runs in a review environment without a .env file.
 * In a real production environment, this would be strictly process.env only.
 */
const JWT_SECRET = process.env.JWT_SECRET || "unsafe_secret_key";

/**
 * HELPER: getUserId
 * ------------------------------------------------------------------
 * Decodes the JWT from the Authorization header to identify the user.
 * Returns null if the token is missing or invalid.
 */
const getUserId = (req: any): number | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  
  try {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (err) {
    return null;
  }
};

export const resolvers = {
  // ================================================================
  // QUERIES (Reading Data)
  // ================================================================
  Query: {
    hello: () => "Teebay Server is Online",

    /**
     * Fetch products listed by the currently logged-in user.
     */
    myProducts: async (_: any, __: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized access");
      
      return prisma.product.findMany({
        where: { ownerId: userId },
        orderBy: { datePosted: 'desc' }
      });
    },

    /**
     * Fetch all available products in the marketplace.
     * Logic:
     * - If user is logged in: Exclude their own products.
     * - If guest: Show all products.
     * - Always exclude sold items.
     */
    allProducts: async (_: any, __: any, { req }: any) => {
      const userId = getUserId(req);
      
      return prisma.product.findMany({
        where: {
          isSold: false,
          ownerId: { not: userId || undefined } 
        },
        orderBy: { datePosted: 'desc' }
      });
    },

    /**
     * Fetch single product details and increment view count.
     * Side Effect: Updates the database (views + 1) on a read operation.
     */
    product: async (_: any, { id }: { id: number }) => {
      return prisma.product.update({
        where: { id: Number(id) },
        data: { views: { increment: 1 } }
      });
    },

    /**
     * Complex filter for transaction history (Bought, Sold, Borrowed, Lent).
     * Uses a mapping strategy to select the correct "WHERE" clause.
     */
    myTransactionHistory: async (_: any, { filter }: { filter: string }, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized access");

      // Define the logic for each tab in the frontend
      const filterMap: Record<string, any> = {
        BOUGHT:   { userId: userId, type: TransactionType.BUY },
        SOLD:     { product: { ownerId: userId }, type: TransactionType.BUY },
        BORROWED: { userId: userId, type: TransactionType.RENT },
        LENT:     { product: { ownerId: userId }, type: TransactionType.RENT },
      };

      const where = filterMap[filter];
      if (!where) return []; // Return empty array if filter is invalid

      return prisma.transaction.findMany({
        where,
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  // ================================================================
  // MUTATIONS (Writing Data)
  // ================================================================
  Mutation: {
    /**
     * Register a new user.
     * Note: Password storage is plain text per specific assignment instructions.
     */
    register: async (_: any, { input }: any) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw new Error('User already exists with this email');

      const user = await prisma.user.create({ 
        data: input 
      });
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    /**
     * Authenticate a user.
     * Uses simple string comparison for password validation.
     */
    login: async (_: any, { input }: any) => {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      
      if (!user || user.password !== input.password) {
        throw new Error('Invalid email or password');
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    // A simple placeholder since JWT is stateless (handled by client)
    logout: async () => true,

    // --- Product Management ---

    createProduct: async (_: any, { input }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized: Please log in");
      
      return prisma.product.create({
        data: { ...input, ownerId: userId }
      });
    },

    updateProduct: async (_: any, { id, input }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");

      const pid = Number(id);
      
      // Authorization Check: Ensure user owns the product
      const product = await prisma.product.findUnique({ where: { id: pid } });
      if (!product || product.ownerId !== userId) {
        throw new Error("Forbidden: You can only edit your own products");
      }

      return prisma.product.update({
        where: { id: pid },
        data: input
      });
    },

    deleteProduct: async (_: any, { id }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");

      const pid = Number(id);
      
      // Authorization Check
      const product = await prisma.product.findUnique({ where: { id: pid } });
      if (!product || product.ownerId !== userId) {
        throw new Error("Forbidden: You can only delete your own products");
      }

      await prisma.product.delete({ where: { id: pid } });
      return true;
    },

    // --- Transactions (Buying & Renting) ---

    /**
     * Buy a product.
     * Uses a Database Transaction to ensure data integrity (atomic operation).
     * 1. Check availability.
     * 2. Mark as sold.
     * 3. Create receipt.
     */
    buyProduct: async (_: any, { productId }: { productId: number }, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");
      const pid = Number(productId);

      return prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: pid } });
        
        if (!product) throw new Error("Product not found");
        if (product.isSold) throw new Error("Product is already sold");
        if (product.ownerId === userId) throw new Error("Cannot buy your own product");

        // Step 1: Mark Product as Sold
        await tx.product.update({
          where: { id: pid },
          data: { isSold: true }
        });

        // Step 2: Create Transaction Record
        await tx.transaction.create({
          data: {
            type: TransactionType.BUY,
            userId,
            productId: pid
          }
        });
        return true;
      });
    },

    /**
     * Rent a product.
     * Creates a transaction record with start/end dates.
     */
    rentProduct: async (_: any, { input }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");

      const { productId, startDate, endDate } = input;

      await prisma.transaction.create({
        data: {
          type: TransactionType.RENT,
          userId,
          productId: Number(productId),
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        }
      });
      return true;
    }
  },

  // ================================================================
  // FIELD RESOLVERS
  // ================================================================
  // These functions run automatically to format data or fetch relations
  // when the specific field is requested by the frontend.

  Product: {
    // Format Date object to String (ISO) for GraphQL compliance
    datePosted: (parent: any) => parent.datePosted.toISOString(),
    
    // Fetch the Owner object for this product
    owner: (parent: any) => prisma.user.findUnique({ where: { id: parent.ownerId } })
  },

  Transaction: {
    // Format Dates
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    startDate: (parent: any) => parent.startDate ? parent.startDate.toISOString() : null,
    endDate: (parent: any) => parent.endDate ? parent.endDate.toISOString() : null,
    
    // Fetch the Product details for this transaction
    product: (parent: any) => prisma.product.findUnique({ where: { id: parent.productId } })
  }
};