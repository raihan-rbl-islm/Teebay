import { useState } from 'react';
import { 
  Container, Paper, Title, TextInput, Button, Group, 
  MultiSelect, Textarea, NumberInput, Select, Stack, Text, Box 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_PRODUCT } from '../graphql/mutations';
import { GET_MY_PRODUCTS } from '../graphql/queries';

// Enum Constants for Dropdowns
const CATEGORY_OPTIONS = [
  'ELECTRONICS', 'FURNITURE', 'HOME_APPLIANCES', 
  'SPORTING_GOODS', 'OUTDOOR', 'TOYS'
];

const RENT_TYPE_OPTIONS = [
  { value: 'PER_DAY', label: 'Per Day' },
  { value: 'PER_HOUR', label: 'Per Hour' }
];

/**
 * COMPONENT: AddProduct
 * ----------------------------------------------------------------------
 * A Multi-step Wizard for creating a new product listing.
 * * Architecture:
 * - Uses a single form instance (useForm) to hold data across all steps.
 * - Manages 'activeStep' state to switch views.
 * - Validates only the relevant fields before moving to the next step.
 */
export function AddProduct() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // GraphQL Mutation
  const [createProduct, { loading }] = useMutation(CREATE_PRODUCT, {
    // Best Practice: Refetch the "My Products" query after creation 
    // so the Dashboard is immediately up-to-date when we redirect.
    refetchQueries: [{ query: GET_MY_PRODUCTS }] 
  });

  // Form State Management
  const form = useForm({
    initialValues: {
      title: '',
      categories: [],
      description: '',
      price: '',     // Managed as string/number in UI, converted to Float for API
      rentPrice: '', 
      rentType: 'PER_DAY',
    },
    
    validate: {
      title: (val) => (activeStep === 0 && !val ? 'Title is required' : null),
      categories: (val) => (activeStep === 1 && val.length === 0 ? 'Select at least one category' : null),
      description: (val) => (activeStep === 2 && !val ? 'Description is required' : null),
      price: (val, values) => {
        if (activeStep === 3) {
          if (!val && !values.rentPrice) return 'You must set a Purchase Price OR Rent Price';
        }
        return null;
      }
    }
  });

  /**
   * NAVIGATION HANDLERS
   */
  const nextStep = () => {
    // Trigger validation for the current step before proceeding
    if (!form.validate().hasErrors) {
      setActiveStep((current) => current + 1);
    }
  };

  const prevStep = () => setActiveStep((current) => current - 1);

  const handleSubmit = async () => {
    try {
      const values = form.values;
      
      // Data Sanitization: Convert strings to numbers for GraphQL Float type
      const payload = {
        title: values.title,
        description: values.description,
        categories: values.categories,
        rentType: values.rentType,
        price: values.price ? parseFloat(String(values.price)) : null,
        rentPrice: values.rentPrice ? parseFloat(String(values.rentPrice)) : null,
      };

      await createProduct({ variables: { input: payload } });
      navigate('/'); // Redirect to Dashboard on success
    } catch (err) {
      console.error("Failed to create product:", err);
    }
  };

  // --- RENDER LOGIC ---
  return (
    <Container size="md" my={40}>
      <Paper withBorder shadow="sm" p={40} radius="md" mihe={500}>
        <Title order={3} mb="xl" c="dimmed">Create product</Title>
        
        {/* Step Content Switcher */}
        <Box mihe={300}>
          {activeStep === 0 && (
            <StepTitle form={form} />
          )}
          {activeStep === 1 && (
            <StepCategories form={form} />
          )}
          {activeStep === 2 && (
            <StepDescription form={form} />
          )}
          {activeStep === 3 && (
            <StepPrice form={form} />
          )}
          {activeStep === 4 && (
            <StepSummary form={form} />
          )}
        </Box>

        {/* Navigation Buttons */}
        <Group justify="space-between" mt="xl">
          {activeStep > 0 && (
            <Button variant="default" onClick={prevStep} color="violet" c="violet">
              Back
            </Button>
          )}
          
          {/* Spacer to push Next button to the right if Back button is hidden */}
          {activeStep === 0 && <div />} 

          {activeStep < 4 ? (
            <Button onClick={nextStep} color="violet">Next</Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading} color="violet">
              Submit
            </Button>
          )}
        </Group>
      </Paper>
    </Container>
  );
}

/**
 * --- STEP COMPONENTS ---
 * Isolated components for each view to keep the main file clean.
 */

function StepTitle({ form }: any) {
  return (
    <Stack align="center" justify="center" h="100%">
      <Title order={2} ta="center" mb="lg">Select a title for your product</Title>
      <TextInput 
        w="100%"
        placeholder="Product Title"
        size="md"
        {...form.getInputProps('title')}
      />
    </Stack>
  );
}

function StepCategories({ form }: any) {
  return (
    <Stack align="center" justify="center" h="100%">
      <Title order={2} ta="center" mb="lg">Select categories</Title>
      <MultiSelect 
        w="100%"
        data={CATEGORY_OPTIONS}
        placeholder="Select a category"
        searchable
        hidePickedOptions
        size="md"
        description="NOTE: This has to be a multi-select dropdown"
        {...form.getInputProps('categories')}
      />
    </Stack>
  );
}

function StepDescription({ form }: any) {
  return (
    <Stack align="center" justify="center" h="100%">
      <Title order={2} ta="center" mb="lg">Select description</Title>
      <Textarea 
        w="100%"
        placeholder="Enter product description..."
        minRows={6}
        size="md"
        {...form.getInputProps('description')}
      />
    </Stack>
  );
}

function StepPrice({ form }: any) {
  return (
    <Stack align="center" justify="center" h="100%">
      <Title order={2} ta="center" mb="lg">Select price</Title>
      
      <Stack w="100%" maw={400}>
        <NumberInput 
          label="Purchase price"
          placeholder="Purchase price"
          prefix="$"
          min={0}
          size="md"
          {...form.getInputProps('price')}
        />

        <Group align="flex-end" grow>
          <NumberInput 
            label="Rent"
            placeholder="$0"
            prefix="$"
            min={0}
            size="md"
            {...form.getInputProps('rentPrice')}
          />
          <Select 
            data={RENT_TYPE_OPTIONS}
            defaultValue="PER_DAY"
            size="md"
            allowDeselect={false}
            {...form.getInputProps('rentType')}
          />
        </Group>
      </Stack>
    </Stack>
  );
}

function StepSummary({ form }: any) {
  const { title, categories, description, price, rentPrice, rentType } = form.values;
  
  return (
    <Stack align="flex-start" justify="center" h="100%" pl={40}>
      <Title order={2} mb="xl">Summary</Title>
      
      <Group mb="sm">
        <Text fw={500} size="lg">Title:</Text>
        <Text size="lg">{title}</Text>
      </Group>

      <Group mb="sm">
        <Text fw={500} size="lg">Categories:</Text>
        <Text size="lg">{categories.join(', ')}</Text>
      </Group>

      <Group mb="sm" align="flex-start">
        <Text fw={500} size="lg">Description:</Text>
        <Text size="lg" style={{ maxWidth: '60%' }}>{description}</Text>
      </Group>

      <Group mb="sm">
        <Text fw={500} size="lg">Price:</Text>
        <Text size="lg">
          ${price || 0}, To rent: ${rentPrice || 0} {rentType.replace('_', ' ').toLowerCase()}
        </Text>
      </Group>
    </Stack>
  );
}