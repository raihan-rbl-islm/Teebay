import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TextInput, PasswordInput, Button, Container, Paper, Title, Text, Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { LOGIN_USER } from '../graphql/mutations';

export function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const [login, { loading, error }] = useMutation(LOGIN_USER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await login({ variables: formData });
      
      // SAVE THE USER (Crucial Step)
      // In a real app, you'd use a token. For this simplified version, we save the ID.
      localStorage.setItem('userId', data.login.id);
      
      alert(`Welcome back, ${data.login.firstName}!`);
      navigate('/'); // Go to Home
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome back!</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Do not have an account? <Anchor href="/register">Register</Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput 
            label="Email" 
            placeholder="you@teebay.com" 
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
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
}