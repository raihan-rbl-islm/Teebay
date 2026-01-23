/**
 * Server Entry Point
 * ----------------------------------------------------------------------------
 * Initializes and starts the Express server with Apollo GraphQL Server.
 * 
 * This module:
 * - Sets up Express application with middleware
 * - Configures Apollo Server with GraphQL schema and resolvers
 * - Establishes GraphQL endpoint at /graphql
 * - Handles server startup and error handling
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { config } from './config';

/**
 * Initializes and starts the server
 * 
 * @throws Error if server fails to start
 */
async function startServer(): Promise<void> {
  const app = express();

  // Initialize Apollo Server with schema and resolvers
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // Enable introspection and playground in development
    introspection: config.nodeEnv !== 'production',
  });

  // Start Apollo Server
  await server.start();

  // Middleware Configuration
  // CORS: Allow cross-origin requests (configure for production)
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Body Parser: Parse JSON request bodies
  app.use(bodyParser.json());

  // GraphQL Endpoint Configuration
  // All GraphQL requests are handled at /graphql
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Pass request object to resolvers for authentication
        return { req };
      },
    })
  );

  // Health Check Endpoint (optional but recommended)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Server Initialization
  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${config.port}/graphql`);
    console.log(`🏥 Health check: http://localhost:${config.port}/health`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
  });
}

// Start server and handle errors
startServer().catch((err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});