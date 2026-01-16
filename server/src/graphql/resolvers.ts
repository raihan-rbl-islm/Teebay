import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    hello: () => 'Hello from Teebay Server!',
    users: async () => await prisma.user.findMany({ include: { products: true } }),
    products: async () => await prisma.product.findMany(),
    product: async (_: any, args: { id: number }) => {
      return await prisma.product.findUnique({ where: { id: args.id } });
    },
    // Show me what I bought or rented
    myTransactions: async (_: any, args: { userId: number }) => {
      return await prisma.transaction.findMany({ 
        where: { userId: args.userId },
        include: { product: true } 
      });
    },
  },

  Mutation: {
    // --- AUTH ---
    register: async (_: any, args: any) => {
      const { firstName, lastName, email, password, address, phoneNumber } = args;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) throw new Error('User already exists');
      const hashedPassword = await bcrypt.hash(password, 10);
      return await prisma.user.create({
        data: { firstName, lastName, email, password: hashedPassword, address, phoneNumber },
      });
    },

    login: async (_: any, args: any) => {
      const { email, password } = args;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('User not found');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw new Error('Invalid password');
      return user;
    },

    // --- PRODUCT ---
    createProduct: async (_: any, args: any) => {
      return await prisma.product.create({
        data: {
          title: args.title,
          description: args.description,
          price: args.price,
          rentPrice: args.rentPrice,
          rentType: args.rentType,
          categories: args.categories,
          ownerId: args.ownerId,
        },
      });
    },

    deleteProduct: async (_: any, args: { id: number }) => {
      try {
        await prisma.product.delete({ where: { id: args.id } });
        return true;
      } catch (error) {
        return false;
      }
    },

    // --- TRANSACTIONS (NEW) ---
    
    // 1. BUY LOGIC
    buyProduct: async (_: any, args: { productId: number, userId: number }) => {
      const product = await prisma.product.findUnique({ where: { id: args.productId } });
      
      if (!product) throw new Error("Product not found");
      if (product.isSold) throw new Error("Product is already sold");

      // Transaction: Atomic Update (Create Receipt AND Mark Sold)
      return await prisma.$transaction(async (tx) => {
        // 1. Mark product as sold
        await tx.product.update({
          where: { id: args.productId },
          data: { isSold: true }
        });

        // 2. Create the receipt
        return await tx.transaction.create({
          data: {
            type: "BUY",
            productId: args.productId,
            userId: args.userId,
          }
        });
      });
    },

    // 2. RENT LOGIC (The Hard Part)
    rentProduct: async (_: any, args: { productId: number, userId: number, startDate: string, endDate: string }) => {
      const { productId, userId, startDate, endDate } = args;
      const start = new Date(startDate);
      const end = new Date(endDate);

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Product not found");
      if (product.isSold) throw new Error("Product is sold and cannot be rented");

      // CHECK FOR OVERLAP
      // We look for ANY existing rental for this product that crashes into our dates
      const conflict = await prisma.transaction.findFirst({
        where: {
          productId: productId,
          type: "RENT",
          OR: [
            {
              // Case 1: Existing rental starts inside our range
              startDate: { lte: end },
              endDate: { gte: start }
            }
          ]
        }
      });

      if (conflict) {
        throw new Error("Product is already rented during these dates");
      }

      // If no conflict, book it
      return await prisma.transaction.create({
        data: {
          type: "RENT",
          productId,
          userId,
          startDate: start,
          endDate: end
        }
      });
    },
  },

  // --- RELATION RESOLVERS ---
  Product: {
    owner: async (parent: any) => await prisma.user.findUnique({ where: { id: parent.ownerId } }),
  },
  User: {
    products: async (parent: any) => await prisma.product.findMany({ where: { ownerId: parent.id } }),
  },
  Transaction: {
    product: async (parent: any) => await prisma.product.findUnique({ where: { id: parent.productId } }),
    user: async (parent: any) => await prisma.user.findUnique({ where: { id: parent.userId } }),
  }
};