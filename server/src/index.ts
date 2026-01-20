import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

async function startServer() {
  // 1. Initialize Express
  const app = express();
  
  // 2. Define Basic GraphQL Schema (Required by Apollo to start)
  const typeDefs = `
    type Query {
      hello: String
    }
  `;

  // 3. Define Basic Resolver
  const resolvers = {
    Query: {
      hello: () => 'Server is up and running!',
    },
  };

  // 4. Setup Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // 5. Start Apollo
  await server.start();

  // 6. Apply Middleware (Connects Express to Apollo)
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server)
  );

  // 7. Start the Listener
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer();