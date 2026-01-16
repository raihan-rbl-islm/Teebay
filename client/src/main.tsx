import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { MantineProvider } from '@mantine/core';
import App from './App';
import '@mantine/core/styles.css'; // Import standard styles

// 1. Initialize the Bridge to the Server
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql', // Your Backend URL
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Wrap the App so every component can access the API */}
    <ApolloProvider client={client}>
      <MantineProvider>
        <App />
      </MantineProvider>
    </ApolloProvider>
  </React.StrictMode>
);