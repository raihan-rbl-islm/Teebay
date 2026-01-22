import { useState } from 'react';
import { 
  Container, 
  Title, 
  Button, 
  Card, 
  Text, 
  Group, 
  Stack, 
  Loader, 
  Center, 
  Paper, 
  ActionIcon, 
  Modal 
} from '@mantine/core';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { IconTrash } from '@tabler/icons-react';
import { GET_MY_PRODUCTS } from '../graphql/queries';
import { DELETE_PRODUCT } from '../graphql/mutations';

/**
 * COMPONENT: Dashboard
 * ----------------------------------------------------------------------
 * Displays the user's products.
 * Features:
 * - Floating "Add Product" button (Fixed position).
 * - Delete functionality with Cache Eviction.
 * - Click-to-Edit navigation.
 */
export function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch Data
  const { loading, error, data } = useQuery(GET_MY_PRODUCTS, {
    fetchPolicy: 'cache-and-network'
  });

  if (loading && !data) return <Center h="100vh"><Loader size="lg" color="violet" /></Center>;

  if (error) {
    return (
      <Container my="xl">
        <Text c="red" ta="center">Error loading products: {error.message}</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      {/* HEADER: Centered Title */}
      <Title order={2} fw={700} ta="center" mb={30} c="dark.4">
        MY PRODUCTS
      </Title>

      {/* CONTENT: Product List */}
      <Stack gap="lg" mb={100}> {/* Added bottom margin so last card isn't hidden by the floating button */}
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

      {/* FLOATING "ADD PRODUCT" BUTTON 
        -----------------------------------------------------------------
        position: fixed -> Removes it from normal flow, relative to viewport.
        bottom/right -> Pins it to the corner.
        zIndex -> Ensures it floats above content.
      */}
      <div style={{ position: 'fixed', bottom: 40, right: 40, zIndex: 100 }}>
        <Button 
          color="violet" 
          size="lg" 
          shadow="xl"
          radius="xl" // Makes it pill-shaped or rounded
          onClick={() => navigate('/add-product')}
          style={{ boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)' }} // Add shadow for depth
        >
          Add Product
        </Button>
      </div>
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

  // DELETE MUTATION
  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT, {
    update(cache) {
      const normalizedId = cache.identify({ id: product.id, __typename: 'Product' });
      cache.evict({ id: normalizedId });
      cache.gc();
    }
  });

  const handleDelete = async () => {
    try {
      await deleteProduct({ variables: { id: product.id } });
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

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
        {/* TRASH ICON */}
        <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
          <ActionIcon 
            color="red" 
            variant="transparent" 
            size="lg"
            onClick={(e) => {
              e.stopPropagation(); 
              setModalOpen(true);
            }}
          >
            <IconTrash size={20} stroke={1.5} />
          </ActionIcon>
        </div>

        {/* CONTENT */}
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

      {/* CONFIRMATION MODAL */}
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