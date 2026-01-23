/**
 * Navbar Component
 * ----------------------------------------------------------------------------
 * Main navigation bar for authenticated users.
 * 
 * Features:
 * - Brand logo/name (clickable, navigates to dashboard)
 * - Navigation links (My Products, All Products, Transactions)
 * - Active route highlighting
 * - Logout functionality with Apollo cache clearing
 */

import { Group, Button, Title, Container, Paper, Anchor } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';

/**
 * Navbar Component
 * 
 * @returns Navigation bar with links and logout button
 */
export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const client = useApolloClient();

  /**
   * Handles user logout
   * 
   * Process:
   * 1. Removes authentication token from localStorage
   * 2. Clears Apollo Client cache to remove sensitive data
   * 3. Redirects to login page
   */
  const handleLogout = async () => {
    localStorage.removeItem('token');
    await client.clearStore();
    navigate('/login');
  };

  /**
   * Checks if a route is currently active
   * Used for styling active navigation links
   * 
   * @param path - Route path to check
   * @returns True if the route matches current location
   */
  const isActive = (path: string) => location.pathname === path;

  return (
    <Paper shadow="xs" p="md" mb="xl">
      <Container size="md">
        <Group justify="space-between">
          
          {/* LOGO / BRAND */}
          <Title order={3} c="violet" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            Teebay
          </Title>

          {/* NAVIGATION LINKS */}
          <Group gap="xl">
            <Anchor 
              component="button" 
              c={isActive('/') ? 'violet' : 'dimmed'} 
              fw={isActive('/') ? 700 : 500}
              onClick={() => navigate('/Dashboard')}
            >
              My Products
            </Anchor>

            <Anchor 
              component="button" 
              c={isActive('/products') ? 'violet' : 'dimmed'} 
              fw={isActive('/products') ? 700 : 500}
              onClick={() => navigate('/products')}
            >
              All Products
            </Anchor>

            <Anchor 
              component="button" 
              c={isActive('/transactions') ? 'violet' : 'dimmed'} 
              fw={isActive('/transactions') ? 700 : 500}
              onClick={() => navigate('/transactions')}
            >
              Transactions
            </Anchor>

          </Group>

          {/* LOGOUT BUTTON */}
          <Button color="red" variant="outline" size="xs" onClick={handleLogout}>
            Logout
          </Button>

        </Group>
      </Container>
    </Paper>
  );
}