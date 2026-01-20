import { PrismaClient, TransactionType } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "unsafe_secret_key";

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
  // QUERIES
  // ================================================================
  Query: {
    hello: () => "Teebay Server is Online",

    myProducts: async (_: any, __: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized access");
      
      return prisma.product.findMany({
        where: { ownerId: userId },
        orderBy: { datePosted: 'desc' }
      });
    },

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
     * product (Single Item Details)
     * --------------------------------------------------------------
     * Fetches details for a single product.
     * LOGIC FIX: Only increments 'views' if the viewer is NOT the owner.
     */
    product: async (_: any, { id }: { id: number }, { req }: any) => {
      const productId = Number(id);
      const currentUserId = getUserId(req);

      // 1. Fetch the product first to check ownership
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) throw new Error("Product not found");

      // 2. Analytics Check:
      // If the viewer is the owner, return data WITHOUT incrementing views.
      if (currentUserId && product.ownerId === currentUserId) {
        return product;
      }

      // 3. If viewer is a Guest or Another User, increment view count.
      return prisma.product.update({
        where: { id: productId },
        data: { views: { increment: 1 } }
      });
    },

    myTransactionHistory: async (_: any, { filter }: { filter: string }, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized access");

      const filterMap: Record<string, any> = {
        BOUGHT:   { userId: userId, type: TransactionType.BUY },
        SOLD:     { product: { ownerId: userId }, type: TransactionType.BUY },
        BORROWED: { userId: userId, type: TransactionType.RENT },
        LENT:     { product: { ownerId: userId }, type: TransactionType.RENT },
      };

      const where = filterMap[filter];
      if (!where) return []; 

      return prisma.transaction.findMany({
        where,
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  // ================================================================
  // MUTATIONS (Rest of the file remains unchanged)
  // ================================================================
  Mutation: {
    register: async (_: any, { input }: any) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw new Error('User already exists with this email');
      const user = await prisma.user.create({ data: input });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    login: async (_: any, { input }: any) => {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user || user.password !== input.password) {
        throw new Error('Invalid email or password');
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    logout: async () => true,

    createProduct: async (_: any, { input }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");
      return prisma.product.create({
        data: { ...input, ownerId: userId }
      });
    },

    updateProduct: async (_: any, { id, input }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");
      const pid = Number(id);
      
      const product = await prisma.product.findUnique({ where: { id: pid } });
      if (!product || product.ownerId !== userId) {
        throw new Error("Forbidden");
      }

      return prisma.product.update({ where: { id: pid }, data: input });
    },

    deleteProduct: async (_: any, { id }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");
      const pid = Number(id);
      
      const product = await prisma.product.findUnique({ where: { id: pid } });
      if (!product || product.ownerId !== userId) {
        throw new Error("Forbidden");
      }

      await prisma.product.delete({ where: { id: pid } });
      return true;
    },

    buyProduct: async (_: any, { productId }: { productId: number }, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");
      const pid = Number(productId);

      return prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: pid } });
        if (!product) throw new Error("Product not found");
        if (product.isSold) throw new Error("Product is already sold");
        if (product.ownerId === userId) throw new Error("Cannot buy your own product");

        await tx.product.update({
          where: { id: pid },
          data: { isSold: true }
        });

        await tx.transaction.create({
          data: { type: TransactionType.BUY, userId, productId: pid }
        });
        return true;
      });
    },

    rentProduct: async (_: any, { input }: any, { req }: any) => {
      const userId = getUserId(req);
      if (!userId) throw new Error("Unauthorized");

      await prisma.transaction.create({
        data: {
          type: TransactionType.RENT,
          userId,
          productId: Number(input.productId),
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate)
        }
      });
      return true;
    }
  },

  // ================================================================
  // FIELD RESOLVERS
  // ================================================================
  Product: {
    datePosted: (parent: any) => parent.datePosted.toISOString(),
    owner: (parent: any) => prisma.user.findUnique({ where: { id: parent.ownerId } })
  },

  Transaction: {
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    startDate: (parent: any) => parent.startDate ? parent.startDate.toISOString() : null,
    endDate: (parent: any) => parent.endDate ? parent.endDate.toISOString() : null,
    product: (parent: any) => prisma.product.findUnique({ where: { id: parent.productId } })
  }
};