import { useQuery } from '@apollo/client';
import { Container, SimpleGrid, Title, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { GET_ALL_PRODUCTS } from '../graphql/queries';
import { ProductCard } from '../components/ProductCard';

export function Home() {
  const { loading, error, data } = useQuery(GET_ALL_PRODUCTS);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/login');
  };

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title>Marketplace</Title>
        <Group>
           <Button variant="outline" onClick={() => navigate('/create-product')}>
             + Sell Item
           </Button>
           <Button color="red" onClick={handleLogout}>
             Logout
           </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {data.products.map((product: any) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </SimpleGrid>
      
      {data.products.length === 0 && (
        <p>No products found. Be the first to add one!</p>
      )}
    </Container>
  );
}