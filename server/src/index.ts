// server/src/index.ts
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';

async function startServer() {
  const app = express();
  
  // 1. Define the GraphQL Schema (The "Header File")
  const typeDefs = `
    type Query {
      hello: String
    }
  `;

  // 2. Define the Resolvers (The "Implementation")
  const resolvers = {
    Query: {
      hello: () => 'Hello from Teebay Server!',
    },
  };

  // 3. Initialize the Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // 4. Start the server engine
  await server.start();

  // 5. Mount it to the '/graphql' endpoint
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server)
  );

  // 6. Start listening on port 4000
  app.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
  });
}

startServer();