import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TextInput, PasswordInput, Button, Container, Paper, Title, Text, Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { REGISTER_USER } from '../graphql/mutations';

export function Register() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const navigate = useNavigate();
  
  // Connect to the Backend Mutation
  const [register, { loading, error }] = useMutation(REGISTER_USER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ variables: formData });
      alert('Registration Successful! Please Login.');
      navigate('/login'); // Redirect to login page
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Create Account</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Already have an account? <Anchor href="/login">Login</Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput 
            label="First Name" 
            placeholder="Raihan" 
            required 
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <TextInput 
            label="Last Name" 
            placeholder="Islam" 
            mt="md" 
            required
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
          <TextInput 
            label="Email" 
            placeholder="you@teebay.com" 
            mt="md" 
            required 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <PasswordInput 
            label="Password" 
            placeholder="Your secret" 
            mt="md" 
            required 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          
          {error && <Text c="red" size="sm" mt="sm">{error.message}</Text>}

          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Register
          </Button>
        </form>
      </Paper>
    </Container>
  );
}