import { useState } from 'react';
import { Container, Title, Tabs, Stack, Card, Text, Group, Loader, Center, Paper, Anchor } from '@mantine/core';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_TRANSACTION_HISTORY } from '../graphql/queries';

/**
 * COMPONENT: Transactions
 * ----------------------------------------------------------------------
 * Displays four tabs: Bought, Sold, Borrowed, and Lent.
 */
export function Transactions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('BOUGHT');

  // Fetch data based on the active tab
  const { data, loading, error } = useQuery(GET_TRANSACTION_HISTORY, {
    variables: { filter: activeTab },
    fetchPolicy: 'network-only',
  });

  return (
    <Container size="md" py="xl">
      <Title order={2} ta="center" mb="xl" fw={700} c="dark.4">
        Bought/Sold/Borrowed/Lent
      </Title>

      <Tabs color="violet" value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List grow>
          <Tabs.Tab value="BOUGHT">Bought</Tabs.Tab>
          <Tabs.Tab value="SOLD">Sold</Tabs.Tab>
          <Tabs.Tab value="BORROWED">Borrowed</Tabs.Tab>
          <Tabs.Tab value="LENT">Lent</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {loading ? (
        <Center h={200}><Loader color="violet" /></Center>
      ) : error ? (
        <Text c="red" ta="center">Error loading transactions: {error.message}</Text>
      ) : (
        <Stack gap="lg">
          {data?.myTransactionHistory.length === 0 ? (
            <Paper withBorder p="xl" ta="center" c="dimmed">
              No transactions found in this category.
            </Paper>
          ) : (
            data.myTransactionHistory.map((item: any) => (
              <TransactionCard key={item.id} transaction={item} />
            ))
          )}
        </Stack>
      )}
    </Container>
  );
}

/**
 * SUB-COMPONENT: TransactionCard
 * ----------------------------------------------------------------------
 * Displays a single product from the transaction history.
 */
function TransactionCard({ transaction }: { transaction: any }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { product } = transaction;

  return (
    <Card shadow="sm" padding="lg" radius="sm" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${product.id}`)}>
      <Title order={4} mb={5} fw={600} c="dark.4">
        {product.title}
      </Title>
      
      <Text size="sm" c="dimmed" mb="xs">Categories: {product.categories.join(', ')}</Text>
      <Text size="sm" mb="md" c="dimmed">
        Price: ${product.price} | Rent: ${product.rentPrice} {product.rentType?.toLowerCase()}
      </Text>

      <Text size="sm" lineClamp={expanded ? 0 : 3} c="dark.3">
        {product.description}
      </Text>
      
      <Anchor component="button" size="sm" c="blue" mb="sm" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
        {expanded ? "Show Less" : "... More Details"}
      </Anchor>

      {/* Show rental dates for Borrowed/Lent items */}
      {(transaction.type === 'RENT' || transaction.startDate) && (
        <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid #eee' }}>
          <Text size="xs" c="violet" fw={500}>
            Period: {new Date(transaction.startDate).toLocaleDateString()} - {new Date(transaction.endDate).toLocaleDateString()}
          </Text>
          <Text size="xs" c="dimmed">Transacted: {new Date(transaction.createdAt).toLocaleDateString()}</Text>
        </Group>
      )}
    </Card>
  );
}