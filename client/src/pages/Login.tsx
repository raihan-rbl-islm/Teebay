import { useForm } from '@mantine/form';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Container, 
  Text, 
  Anchor, 
  Stack 
} from '@mantine/core';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

// Internal Imports
import { LOGIN_USER } from '../graphql/mutations';

/**
 * COMPONENT: Login
 * ----------------------------------------------------------------------
 * Handles user authentication.
 * * Flow:
 * 1. Captures email/password via Mantine useForm.
 * 2. Validates inputs on the client side (Regex for email).
 * 3. Sends mutation to GraphQL API.
 * 4. On success: Stores JWT in LocalStorage and redirects to Dashboard.
 * 5. On failure: Displays error message from the backend.
 */
export function Login() {
  const navigate = useNavigate();

  // GraphQL Mutation Hook
  // 'loading' state is used to disable the button during network requests
  // 'error' captures backend rejections (e.g., "Invalid password")
  const [login, { loading, error }] = useMutation(LOGIN_USER);

  // Form State Management
  const form = useForm({
    initialValues: { 
      email: '', 
      password: '' 
    },
    
    // Client-side validation rules
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email address'),
      // We do not validate password length here to avoid leaking security policies
      // or preventing legacy users from logging in.
    },
  });

  /**
   * HANDLER: handleSubmit
   * ------------------------------------------------------------------
   * Executed only if client-side validation passes.
   * @param values - The form data object { email, password }
   */
  const handleSubmit = async (values: typeof form.values) => {
    try {
      // FIX: Wrap 'values' inside an 'input' object to match GraphQL definition
      const { data } = await login({ 
        variables: { 
          input: { email: values.email, password: values.password } 
        } 
      });

      if (data?.login?.token) {
        localStorage.setItem('token', data.login.token);
        // Force a hard reload to ensure Apollo Client picks up the new token
        window.location.href = '/'; 
      }
    } catch (err) {
      console.error("Login Failed:", err);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900}>
        SIGN IN
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {/* Email Field */}
            <TextInput 
              label="Email" 
              placeholder="Enter your email" 
              required 
              {...form.getInputProps('email')} 
            />
            
            {/* Password Field */}
            <PasswordInput 
              label="Password" 
              placeholder="Enter your password" 
              required 
              {...form.getInputProps('password')} 
            />
            
            {/* Error Feedback Section */}
            {/* Renders only if the backend returns an error */}
            {error && (
              <Text c="red" size="sm" ta="center">
                {error.message}
              </Text>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              fullWidth 
              mt="xl" 
              loading={loading} 
              color="violet"
            >
              LOGIN
            </Button>
          </Stack>
        </form>

        {/* Footer: Navigation to Register */}
        <Text c="dimmed" size="sm" ta="center" mt={15}>
          Don't have an account?{' '}
          <Anchor component="button" size="sm" onClick={() => navigate('/register')}>
            Signup
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}