import { useState } from 'react';
import { Container, Title, Tabs, Stack, Card, Text, Group, Loader, Center, Paper } from '@mantine/core';
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
  // Skip query if activeTab is null to prevent invalid filter
  const { data, loading, error } = useQuery(GET_TRANSACTION_HISTORY, {
    variables: { filter: activeTab || 'BOUGHT' },
    fetchPolicy: 'network-only',
    skip: !activeTab, // Skip query if tab is not selected
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
 * Entire card is clickable to navigate to product details.
 */
function TransactionCard({ transaction }: { transaction: any }) {
  const navigate = useNavigate();
  const { product } = transaction;

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="sm" 
      withBorder 
      style={{ 
        cursor: 'pointer', 
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <Title order={4} mb={5} fw={600} c="dark.4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
        {product.title}
      </Title>
      
      <Text size="sm" c="dimmed" mb="xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
        Categories: {product.categories.join(', ')}
      </Text>
      
      {/* Show transaction-specific pricing (snapshot at time of transaction) */}
      <Text size="sm" mb="md" c="dimmed" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
        {transaction.type === 'BUY' && transaction.transactionPrice && (
          <>Purchased for: <span style={{ color: '#495057', fontWeight: 500 }}>${transaction.transactionPrice}</span></>
        )}
        {transaction.type === 'RENT' && transaction.transactionRentPrice && (
          <>Rented for: <span style={{ color: '#495057', fontWeight: 500 }}>${transaction.transactionRentPrice} {transaction.transactionRentType?.toLowerCase().replace('_', ' ')}</span></>
        )}
        {transaction.type === 'BUY' && !transaction.transactionPrice && (
          <>Price: ${product.price || 'N/A'}</>
        )}
        {transaction.type === 'RENT' && !transaction.transactionRentPrice && (
          <>Rent: ${product.rentPrice || 'N/A'} {product.rentType?.toLowerCase() || 'N/A'}</>
        )}
      </Text>

      {/* Full Description - No truncation */}
      <Text 
        size="sm" 
        mb="md" 
        c="dark.3"
        style={{ 
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden'
        }}
      >
        {product.description}
      </Text>

      {/* Show transaction date and rental period (if applicable) for all transaction types */}
      <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid #eee' }}>
        {transaction.type === 'RENT' && transaction.startDate && (
          <Text size="xs" c="violet" fw={500}>
            Period: {new Date(transaction.startDate).toLocaleDateString()} - {new Date(transaction.endDate).toLocaleDateString()}
          </Text>
        )}
        <Text size="xs" c="dimmed">Transacted: {new Date(transaction.createdAt).toLocaleDateString()}</Text>
      </Group>
    </Card>
  );
}