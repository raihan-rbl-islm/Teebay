import { Group, Button, Title, Container, Paper, Anchor } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const client = useApolloClient();

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await client.clearStore();
    navigate('/login');
  };

  // Helper to check active link for styling
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
              onClick={() => navigate('/')}
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