import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';

/**
 * ENTRY POINT
 * ------------------------------------------------------------------
 * Initializes the Express application and Apollo Server instance.
 */
async function startServer() {
  const app = express();
  
  // Initialize Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  // Middleware Configuration
  app.use(cors());
  app.use(bodyParser.json());

  // GraphQL Endpoint Configuration
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    })
  );

  // Server Initialization
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err);
});