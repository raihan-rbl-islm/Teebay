import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Paper, Title, Text, Group, Button, 
  Stack, Loader, Center, Modal, TextInput, Badge
} from '@mantine/core';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PRODUCT_DETAILS, GET_ALL_PRODUCTS, GET_MY_TRANSACTION_FOR_PRODUCT } from '../graphql/queries';
import { BUY_PRODUCT, RENT_PRODUCT } from '../graphql/mutations';

/**
 * COMPONENT: ProductDetails
 * ----------------------------------------------------------------------
 * Displays full product info and handles Buy/Rent interactions.
 * This version uses NATIVE HTML5 date inputs to avoid installation errors.
 */
export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);

  // Modal control
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [rentModalOpen, setRentModalOpen] = useState(false);
  
  // Date state (using strings for native input compatibility)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch Product Data
  const { data, loading, error } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { id: productId },
  });

  // 2. Fetch User's Transaction for this Product (if any)
  const { data: transactionData } = useQuery(GET_MY_TRANSACTION_FOR_PRODUCT, {
    variables: { productId },
    skip: !productId, // Skip if productId is invalid
  });

  // 3. Buy Mutation
  const [buyProduct, { loading: buying }] = useMutation(BUY_PRODUCT, {
    refetchQueries: [{ query: GET_ALL_PRODUCTS }, { query: GET_MY_TRANSACTION_FOR_PRODUCT, variables: { productId } }]
  });

  // 4. Rent Mutation
  const [rentProduct, { loading: renting }] = useMutation(RENT_PRODUCT, {
    refetchQueries: [{ query: GET_MY_TRANSACTION_FOR_PRODUCT, variables: { productId } }]
  });

  const handleBuy = async () => {
    try {
      await buyProduct({ variables: { productId } });
      setBuyModalOpen(false);
      navigate('/products'); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleRent = async () => {
    if (!startDate || !endDate) return;
    try {
      await rentProduct({ 
        variables: { 
          input: { 
            productId, 
            startDate: new Date(startDate).toISOString(), 
            endDate: new Date(endDate).toISOString() 
          } 
        } 
      });
      setRentModalOpen(false);
      navigate('/products');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Center h="100vh"><Loader color="violet" /></Center>;
  if (error || !data?.product) return <Center h="100vh"><Text>Product not found</Text></Center>;

  const { product } = data;
  const myTransaction = transactionData?.myTransactionForProduct;
  const isOwner = false; // TODO: Check ownership via query if needed

  // Determine what to show based on user's transaction status
  const showTransactionInfo = myTransaction && myTransaction.type;
  const showBuyRentButtons = !product.isSold && !showTransactionInfo;

  return (
    <Container size="md" py={40}>
      <Paper withBorder p={40} radius="md" style={{ minHeight: '500px' }}>
        <Stack gap="xl">
          <div>
            <Title order={2} mb="xs">{product.title}</Title>
            <Text c="dimmed" size="sm">Categories: {product.categories.join(', ')}</Text>
            
            {/* Show transaction-specific pricing if user has transaction */}
            {showTransactionInfo ? (
              <div>
                {myTransaction.type === 'BUY' && myTransaction.transactionPrice && (
                  <Badge color="green" size="lg" mt={5} p="md">
                    You bought this product for ${myTransaction.transactionPrice}
                  </Badge>
                )}
                {myTransaction.type === 'RENT' && myTransaction.transactionRentPrice && (
                  <Badge color="blue" size="lg" mt={5} p="md">
                    You rented this product for ${myTransaction.transactionRentPrice} {myTransaction.transactionRentType?.toLowerCase().replace('_', ' ')}
                    {myTransaction.startDate && myTransaction.endDate && (
                      <Text size="xs" mt={5}>
                        Period: {new Date(myTransaction.startDate).toLocaleDateString()} - {new Date(myTransaction.endDate).toLocaleDateString()}
                      </Text>
                    )}
                  </Badge>
                )}
              </div>
            ) : (
              <Text c="dimmed" size="sm" mt={5}>
                {product.price && `Price: $${product.price}`}
                {product.price && product.rentPrice && ' | '}
                {product.rentPrice && `Rent: $${product.rentPrice} ${product.rentType?.toLowerCase().replace('_', ' ')}`}
              </Text>
            )}
          </div>

          <Text size="md" style={{ lineHeight: 1.6 }}>
            {product.description}
          </Text>

          <Group justify="flex-end" mt={100}>
            {/* Show Buy/Rent buttons only if product is available and user hasn't transacted */}
            {showBuyRentButtons && (
              <>
                {product.rentPrice && product.rentType && (
                  <Button color="violet" size="md" onClick={() => setRentModalOpen(true)}>
                    Rent
                  </Button>
                )}
                {product.price && (
                  <Button color="violet" size="md" onClick={() => setBuyModalOpen(true)}>
                    Buy
                  </Button>
                )}
              </>
            )}
            
            {/* Show sold message only if product is sold and user hasn't bought it */}
            {product.isSold && !showTransactionInfo && (
              <Text c="red" fw={500} size="lg">
                This product has been sold
              </Text>
            )}
          </Group>
        </Stack>
      </Paper>

      {/* BUY CONFIRMATION MODAL */}
      <Modal 
        opened={buyModalOpen} 
        onClose={() => setBuyModalOpen(false)} 
        title="Purchase confirmation"
        centered
      >
        <Text size="sm" mb="xl" ta="center">Are you sure you want to buy this product?</Text>
        <Group justify="center">
          <Button variant="filled" color="red" onClick={() => setBuyModalOpen(false)}>No</Button>
          <Button color="violet" onClick={handleBuy} loading={buying}>Yes</Button>
        </Group>
      </Modal>

      {/* RENTAL PERIOD MODAL */}
      <Modal 
        opened={rentModalOpen} 
        onClose={() => setRentModalOpen(false)} 
        title="Rental period"
        centered
        size="lg"
      >
        <Group grow mb="xl">
          {/* Using TextInput with type="date" for native browser picker */}
          <TextInput 
            label="From" 
            type="date"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <TextInput 
            label="To" 
            type="date"
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </Group>
        <Group justify="center">
          <Button variant="filled" color="red" onClick={() => setRentModalOpen(false)}>Go Back</Button>
          <Button color="violet" onClick={handleRent} loading={renting} disabled={!startDate || !endDate}>
            Confirm rent
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}