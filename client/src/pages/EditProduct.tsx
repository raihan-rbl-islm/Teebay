import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Paper, Title, TextInput, Button, Group, 
  MultiSelect, Textarea, NumberInput, Select, Stack, Loader, Center 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PRODUCT_DETAILS } from '../graphql/queries';
import { UPDATE_PRODUCT } from '../graphql/mutations';
import { GET_MY_PRODUCTS } from '../graphql/queries';

// Reuse constants
const CATEGORY_OPTIONS = [
  'ELECTRONICS', 'FURNITURE', 'HOME_APPLIANCES', 
  'SPORTING_GOODS', 'OUTDOOR', 'TOYS'
];

const RENT_TYPE_OPTIONS = [
  { value: 'PER_DAY', label: 'Per Day' },
  { value: 'PER_HOUR', label: 'Per Hour' }
];

/**
 * COMPONENT: EditProduct
 * ----------------------------------------------------------------------
 * Handles updating an existing product.
 * 1. Fetches current data using ID from URL.
 * 2. Pre-fills the form.
 * 3. Sends mutation on submit.
 */
export function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);

  // 1. Fetch Existing Data
  const { data, loading: queryLoading, error } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { id: productId },
    fetchPolicy: 'network-only'
  });

  // 2. Setup Mutation
  const [updateProduct, { loading: mutationLoading }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: GET_MY_PRODUCTS }]
  });

  const form = useForm({
    initialValues: {
      title: '',
      categories: [],
      description: '',
      price: '',
      rentPrice: '',
      rentType: 'PER_DAY',
    },
    validate: {
      title: (val) => (!val ? 'Title is required' : null),
      categories: (val) => (val.length === 0 ? 'Select at least one category' : null),
      description: (val) => (!val ? 'Description is required' : null),
    }
  });

  // 3. Populate Form when Data Arrives
  useEffect(() => {
    if (data?.product) {
      form.setValues({
        title: data.product.title,
        categories: data.product.categories,
        description: data.product.description,
        price: data.product.price || '',
        rentPrice: data.product.rentPrice || '',
        rentType: data.product.rentType || 'PER_DAY',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const price = values.price ? parseFloat(String(values.price)) : null;
      const rentPrice = values.rentPrice ? parseFloat(String(values.rentPrice)) : null;
      
      const payload = {
        title: values.title,
        description: values.description,
        categories: values.categories,
        price,
        rentPrice,
        // Only include rentType if rentPrice is provided
        rentType: rentPrice ? values.rentType : null,
      };

      await updateProduct({ 
        variables: { 
          id: productId, 
          input: payload 
        } 
      });
      
      navigate('/Dashboard');
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (queryLoading) return <Center h="100vh"><Loader color="violet" /></Center>;
  if (error) return <Center h="100vh">Error loading product</Center>;

  return (
    <Container size="md" my={40}>
      <Paper withBorder shadow="sm" p={40} radius="md">
        <Title order={3} mb="xl" c="dimmed">Edit product</Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            
            <TextInput 
              label="Title" 
              placeholder="Title"
              {...form.getInputProps('title')}
            />

            <MultiSelect 
              label="Categories"
              data={CATEGORY_OPTIONS}
              placeholder="Select categories"
              hidePickedOptions
              {...form.getInputProps('categories')}
            />

            <Textarea 
              label="Description"
              placeholder="Description"
              minRows={6}
              {...form.getInputProps('description')}
            />

            <Group grow align="flex-start">
              <NumberInput 
                label="Price"
                placeholder="Purchase Price"
                prefix="$"
                {...form.getInputProps('price')}
              />

              <Group align="flex-end" gap="xs" grow>
                <NumberInput 
                  label="Rent"
                  placeholder="Rent Price"
                  prefix="$"
                  {...form.getInputProps('rentPrice')}
                />
                <Select 
                  data={RENT_TYPE_OPTIONS}
                  allowDeselect={false}
                  {...form.getInputProps('rentType')}
                />
              </Group>
            </Group>

            <Group justify="flex-end" mt="xl">
              <Button type="submit" loading={mutationLoading} color="violet">
                Edit Product
              </Button>
            </Group>

          </Stack>
        </form>
      </Paper>
    </Container>
  );
}