import { useState } from 'react';
import { 
  Container, Title, Button, Card, Text, Group, Stack, 
  Loader, Center, Paper, ActionIcon, Modal 
} from '@mantine/core';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { IconTrash } from '@tabler/icons-react'; // Standard Mantine Icon Pack
import { GET_MY_PRODUCTS } from '../graphql/queries';
import { DELETE_PRODUCT } from '../graphql/mutations';

/**
 * COMPONENT: Dashboard
 * ----------------------------------------------------------------------
 * Displays user's products with Delete functionality.
 */
export function Dashboard() {
  const navigate = useNavigate();
  const client = useApolloClient(); 
  
  // Fetch Data
  const { loading, error, data } = useQuery(GET_MY_PRODUCTS, {
    fetchPolicy: 'cache-and-network' // Best practice: Show cache first, then update
  });

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await client.clearStore(); 
    navigate('/login');
  };

  if (loading && !data) return <Center h="100vh"><Loader size="lg" color="violet" /></Center>;

  if (error) {
    return (
      <Container my="xl">
        <Text c="red" ta="center">Error loading products: {error.message}</Text>
        <Center mt="md">
          <Button onClick={handleLogout} variant="outline" color="red">Logout & Retry</Button>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      
      {/* 1. TOP ROW: Logout Button */}
      <Group justify="flex-end" mb="sm">
        <Button color="red" size="sm" fw={700} onClick={handleLogout}>
          LOGOUT
        </Button>
      </Group>

      {/* 2. HEADER: Centered Title */}
      <Title order={2} fw={700} ta="center" mb={30} c="dark.4">
        MY PRODUCTS
      </Title>

      {/* 3. CONTENT: Product List */}
      <Stack gap="lg" mb={30}>
        {data?.myProducts.length === 0 ? (
          <Paper withBorder p="xl" ta="center" c="dimmed">
            You haven't listed any products yet. Click "Add Product" to start.
          </Paper>
        ) : (
          data.myProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </Stack>

      {/* 4. FOOTER: Add Product Button */}
      <Group justify="flex-end">
        <Button color="violet" size="md" onClick={() => navigate('/add-product')}>
          Add Product
        </Button>
      </Group>
    </Container>
  );
}

/**
 * SUB-COMPONENT: ProductCard
 * ----------------------------------------------------------------------
 * Handles display, navigation, and DELETION of a product.
 */
function ProductCard({ product }: { product: any }) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  // DELETE MUTATION WITH CACHE MANAGEMENT
  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT, {
    /**
     * CACHE UPDATE STRATEGY:
     * Instead of refetching the entire list from the server (slow),
     * we manually remove the specific object from the Apollo Cache.
     */
    update(cache) {
      // 1. Identify the object in the cache (e.g., "Product:5")
      const normalizedId = cache.identify({ id: product.id, __typename: 'Product' });
      
      // 2. Evict it from memory
      cache.evict({ id: normalizedId });
      
      // 3. Clean up any dangling references
      cache.gc();
    }
  });

  const handleDelete = async () => {
    try {
      await deleteProduct({ variables: { id: product.id } });
      setModalOpen(false);
      // No need to navigate or refetch; the UI updates instantly due to cache eviction
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // Date Formatting
  const date = new Date(product.datePosted).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <Card 
        shadow="sm" 
        padding="lg" 
        radius="sm" 
        withBorder
        style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
        onClick={() => navigate(`/edit-product/${product.id}`)}
      >
        {/* --- TRASH ICON (Top Right) --- */}
        <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
          <ActionIcon 
            color="red" 
            variant="transparent" 
            size="lg"
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigating to Edit Page
              setModalOpen(true);
            }}
          >
            <IconTrash size={20} stroke={1.5} />
          </ActionIcon>
        </div>

        {/* --- CARD CONTENT --- */}
        <Title order={4} mb={5} fw={600} c="dark.4" pr={40}>
          {product.title}
        </Title>
        
        <Text size="sm" c="dimmed" mb="xs">
          Categories: {product.categories.join(', ')}
        </Text>

        <Text size="sm" mb="md" c="dimmed">
          Price: <span style={{ color: '#495057', fontWeight: 500 }}>${product.price}</span> 
          {' | '}
          Rent: <span style={{ color: '#495057', fontWeight: 500 }}>${product.rentPrice} {product.rentType?.toLowerCase().replace('_', ' ')}</span>
        </Text>

        <Text size="sm" lineClamp={3} mb="xl" c="dark.3">
          {product.description}
        </Text>

        <Group justify="space-between" mt="auto">
          <Text size="xs" c="dimmed">Date posted: {date}</Text>
          <Text size="xs" c="dimmed">{product.views} views</Text>
        </Group>
      </Card>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal 
        opened={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Delete product"
        centered
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete this product?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setModalOpen(false)}>No</Button>
          <Button color="violet" onClick={handleDelete} loading={deleting}>Yes</Button>
        </Group>
      </Modal>
    </>
  );
}