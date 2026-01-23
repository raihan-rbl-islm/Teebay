/**
 * Layout Component
 * ----------------------------------------------------------------------------
 * Protected route wrapper that provides authentication guard and navigation.
 * 
 * This component:
 * - Validates authentication token by checking localStorage
 * - Validates token with server by attempting an authenticated query
 * - Redirects unauthenticated users to login page
 * - Handles invalid/expired tokens by clearing them and redirecting to login
 * - Renders the Navbar component for authenticated users
 * - Uses React Router's Outlet to render child routes
 * 
 * All routes wrapped by this component require authentication.
 */

import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Navbar } from './Navbar';
import { Loader, Center } from '@mantine/core';

/**
 * Simple query to validate authentication
 * Uses myProducts query which requires authentication
 */
const VALIDATE_AUTH = gql`
  query ValidateAuth {
    myProducts {
      id
    }
  }
`;

/**
 * Layout Component
 * 
 * @returns Protected layout with navbar, or redirects to login if not authenticated
 */
export function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const token = localStorage.getItem('token');

  // Validate authentication by attempting a query
  const { loading, error } = useQuery(VALIDATE_AUTH, {
    skip: !token, // Skip query if no token exists
    fetchPolicy: 'network-only', // Always check with server, don't use cache
    errorPolicy: 'all', // Don't throw on error, handle it ourselves
  });

  useEffect(() => {
    // If no token exists, user is not authenticated
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // If query completed successfully, user is authenticated
    if (!loading && !error) {
      setIsAuthenticated(true);
    }

    // If query failed with authentication error, clear token and mark as not authenticated
    if (error) {
      // Check if it's an authentication error
      const isAuthError = 
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Authentication') ||
        error.graphQLErrors?.some((e: any) => 
          e.extensions?.code === 'UNAUTHENTICATED' || 
          e.message?.includes('Unauthorized')
        );

      if (isAuthError) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } else {
        // Other errors might be network issues, still allow access
        setIsAuthenticated(true);
      }
    }
  }, [token, loading, error]);

  // Show loader while checking authentication
  if (isAuthenticated === null || (token && loading)) {
    return (
      <Center h="100vh">
        <Loader size="lg" color="violet" />
      </Center>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected layout with navbar and child routes
  return (
    <>
      <Navbar />
      {/* Outlet renders the matched child route (Dashboard, AllProducts, etc.) */}
      <Outlet />
    </>
  );
}