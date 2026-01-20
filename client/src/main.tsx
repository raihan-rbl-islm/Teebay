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
 * APOLLO CLIENT CONFIGURATION
 * ----------------------------------------------------------------------
 * Sets up the GraphQL connection.
 * We use a "Link Chain" strategy: AuthLink -> HttpLink.
 */

// 1. HTTP Link: Defines the API Endpoint.
// NOTE: In a real production app, this URL should be loaded from 
// environment variables (e.g., import.meta.env.VITE_API_URL).
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

/**
 * 2. Auth Middleware (Interceptor)
 * This function runs before every network request. 
 * It reads the JWT from LocalStorage and adds it to the request headers.
 * This allows the backend 'getUserId' function to identify the user.
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

// 3. Client Instance Initialization
const client = new ApolloClient({
  // Chain the links: First add auth header, then send over HTTP
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

/**
 * ROOT RENDER
 * ----------------------------------------------------------------------
 * The application is wrapped in three essential providers:
 * 1. ApolloProvider: Enables GraphQL hooks (useQuery, useMutation).
 * 2. MantineProvider: Inject UI styles and theme context.
 * 3. BrowserRouter: Enables client-side navigation (Routes).
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