import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TextInput, NumberInput, Textarea, Select, MultiSelect, Button, Container, Title, Paper, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { CREATE_PRODUCT } from '../graphql/mutations';
import { GET_ALL_PRODUCTS } from '../graphql/queries';

export function CreateProduct() {
  const navigate = useNavigate();
  const [createProduct, { loading }] = useMutation(CREATE_PRODUCT, {
    // This tells Apollo: "After creating, re-fetch the list so the new item shows up immediately"
    refetchQueries: [{ query: GET_ALL_PRODUCTS }],
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 0,
    rentPrice: 0,
    rentType: 'PER_DAY',
    categories: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ownerId = parseInt(localStorage.getItem('userId') || '0');
      
      await createProduct({
        variables: {
          ...form,
          price: parseFloat(form.price.toString()),
          rentPrice: parseFloat(form.rentPrice.toString()),
          ownerId,
        },
      });
      
      alert('Product Created!');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to create product');
    }
  };

  return (
    <Container size="sm" my={40}>
      <Title mb="xl">Sell an Item</Title>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput 
            label="Title" 
            required 
            placeholder="e.g. iPhone 15"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          
          <Textarea 
            label="Description" 
            mt="md" 
            required
            placeholder="Describe your item..."
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Group grow mt="md">
            <Select
              label="Categories"
              data={['ELECTRONICS', 'FURNITURE', 'HOME_APPLIANCES', 'SPORTING_GOODS', 'OUTDOOR', 'TOYS']}
              required
              onChange={(value) => setForm({ ...form, categories: [value || 'ELECTRONICS'] })}
            />
          </Group>

          <Group grow mt="md">
            <NumberInput 
              label="Purchase Price ($)" 
              required 
              min={0}
              onChange={(val) => setForm({ ...form, price: Number(val) })}
            />
            <NumberInput 
              label="Rent Price ($)" 
              required 
              min={0}
              onChange={(val) => setForm({ ...form, rentPrice: Number(val) })}
            />
            <Select
              label="Rent Type"
              data={['PER_DAY', 'PER_HOUR']}
              defaultValue="PER_DAY"
              onChange={(val) => setForm({ ...form, rentType: val || 'PER_DAY' })}
            />
          </Group>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={() => navigate('/')}>Cancel</Button>
            <Button type="submit" loading={loading}>Submit</Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}