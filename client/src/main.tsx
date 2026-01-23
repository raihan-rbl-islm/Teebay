import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Third-Party Libraries
import { MantineProvider } from '@mantine/core';
import { 
  ApolloClient, 
  InMemoryCache, 
  ApolloProvider, 
  createHttpLink 
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Local Imports
import App from './App.tsx';

// Global Styles (Required for Mantine v7)
import '@mantine/core/styles.css';

/**
 * Application Entry Point
 * ----------------------------------------------------------------------------
 * Initializes the React application with all necessary providers and configurations.
 * 
 * This module sets up:
 * - Apollo Client for GraphQL communication
 * - Mantine UI component library
 * - React Router for client-side routing
 * - Authentication middleware for API requests
 */

/**
 * Apollo Client Configuration
 * ----------------------------------------------------------------------------
 * Sets up GraphQL client with authentication middleware.
 * 
 * Architecture:
 * - Uses a "Link Chain" strategy: AuthLink -> HttpLink
 * - AuthLink intercepts requests and adds JWT token to headers
 * - HttpLink sends requests to the GraphQL endpoint
 */

// HTTP Link: Defines the GraphQL API endpoint
// Note: In production, this should be loaded from environment variables
// Example: import.meta.env.VITE_API_URL
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

/**
 * Authentication Link (Request Interceptor)
 * 
 * This middleware runs before every GraphQL request.
 * It reads the JWT token from localStorage and adds it to the Authorization header.
 * This allows the backend to identify the authenticated user.
 * 
 * @param _ - Operation (unused)
 * @param headers - Current request headers
 * @returns Modified headers with authorization token
 */
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

/**
 * Apollo Client Instance
 * 
 * Configured with:
 * - Link chain: Auth middleware -> HTTP transport
 * - In-memory cache for query results
 */
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

/**
 * Root Component Render
 * ----------------------------------------------------------------------------
 * The application is wrapped in three essential providers:
 * 
 * 1. ApolloProvider: Enables GraphQL hooks (useQuery, useMutation) throughout the app
 * 2. MantineProvider: Provides UI component styles and theme context
 * 3. BrowserRouter: Enables client-side navigation with React Router
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <MantineProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </ApolloProvider>
  </React.StrictMode>,
);