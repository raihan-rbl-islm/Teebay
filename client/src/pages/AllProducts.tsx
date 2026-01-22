import { 
  Container, 
  Title, 
  Card, 
  Text, 
  Group, 
  Stack, 
  Loader, 
  Center,
  Paper,
  Anchor 
} from '@mantine/core';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_ALL_PRODUCTS } from '../graphql/queries';

/**
 * COMPONENT: AllProducts
 * ----------------------------------------------------------------------
 * The "Marketplace" feed.
 * Displays all products EXCEPT those owned by the current user.
 */
export function AllProducts() {
  // Fetch Data (Backend handles the exclusion of 'my' products)
  const { loading, error, data } = useQuery(GET_ALL_PRODUCTS, {
    fetchPolicy: 'network-only'
  });

  if (loading) return <Center h="100vh"><Loader size="lg" color="violet" /></Center>;

  if (error) {
    return (
      <Container my="xl">
        <Text c="red" ta="center">Error loading marketplace: {error.message}</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      {/* HEADER: Centered Title */}
      <Title order={2} fw={700} ta="center" mb={30} c="dark.4">
        ALL PRODUCTS
      </Title>

      {/* CONTENT: Product List */}
      <Stack gap="lg" mb={30}>
        {data?.allProducts.length === 0 ? (
          <Paper withBorder p="xl" ta="center" c="dimmed">
            No products found in the marketplace.
          </Paper>
        ) : (
          data.allProducts.map((product: any) => (
            <MarketplaceCard key={product.id} product={product} />
          ))
        )}
      </Stack>
    </Container>
  );
}

/**
 * SUB-COMPONENT: MarketplaceCard
 * ----------------------------------------------------------------------
 * A read-only card optimized for browsing.
 * Distinct from "ProductCard" in Dashboard (No Edit/Delete buttons).
 */
function MarketplaceCard({ product }: { product: any }) {
  const navigate = useNavigate();

  // Date Formatting
  const date = new Date(product.datePosted).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card shadow="sm" padding="lg" radius="sm" withBorder>
      <Title order={4} mb={5} fw={600} c="dark.4">
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

      {/* Description with "More Details" Link */}
      <Text size="sm" lineClamp={3} mb="xl" c="dark.3">
        {product.description}{' '}
        <Anchor component="button" size="sm" c="blue" onClick={() => navigate(`/product/${product.id}`)}>
          ... More Details
        </Anchor>
      </Text>

      {/* Footer Metadata */}
      <Group justify="space-between" mt="auto">
        <Text size="xs" c="dimmed">Date posted: {date}</Text>
        <Text size="xs" c="dimmed">{product.views} views</Text>
      </Group>
    </Card>
  );
}