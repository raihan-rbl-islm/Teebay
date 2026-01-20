import { useForm } from '@mantine/form';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Container, 
  Grid, 
  Text, 
  Anchor 
} from '@mantine/core';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

// Internal Imports
import { REGISTER_USER } from '../graphql/mutations';

/**
 * COMPONENT: Register
 * ----------------------------------------------------------------------
 * Handles new user registration.
 * * Features:
 * - Multi-field form with client-side validation (Email regex, Password match).
 * - Sanitizes input (removes 'confirmPassword') before sending to GraphQL.
 * - Auto-login upon successful registration (stores token and redirects).
 */
export function Register() {
  const navigate = useNavigate();

  // GraphQL Mutation Hook
  // 'loading' disables the submit button to prevent double-submissions
  // 'error' displays backend validation issues (e.g. "Email already exists")
  const [register, { loading, error }] = useMutation(REGISTER_USER);

  // Form State Management
  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      address: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },

    // Client-side Validation Rules
    validate: {
      // Regex check for basic email format
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email address'),
      
      // Enforce minimum security length
      password: (val) => (val.length < 6 ? 'Password must be at least 6 characters' : null),
      
      // Cross-field validation: Ensure passwords match
      confirmPassword: (val, values) => (val !== values.password ? 'Passwords do not match' : null),
    },
  });

  /**
   * HANDLER: handleSubmit
   * ------------------------------------------------------------------
   * Processes the form submission.
   * NOTE: We must destructure and remove 'confirmPassword' because 
   * the backend API schema does not accept that field.
   * * @param values - The raw form data object.
   */
  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Data Sanitization: Separate the utility field from the API payload
      const { confirmPassword, ...input } = values;

      // Execute Mutation
      const { data } = await register({ variables: { input } });
      
      // On Success: Persist session and redirect
      if (data?.register?.token) {
        localStorage.setItem('token', data.register.token);
        navigate('/');
      }
    } catch (err) {
      // Error is visually handled by the UI via the 'error' object from useMutation,
      // but logging it helps with debugging during development.
      console.error("Registration Failed:", err);
    }
  };

  return (
    <Container size={600} my={40}>
      <Title ta="center" fw={900}>
        SIGN UP
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            {/* --- Personal Information Section --- */}
            <Grid.Col span={6}>
              <TextInput 
                label="First Name" 
                placeholder="First Name" 
                required 
                {...form.getInputProps('firstName')} 
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <TextInput 
                label="Last Name" 
                placeholder="Last Name" 
                required 
                {...form.getInputProps('lastName')} 
              />
            </Grid.Col>

            {/* --- Address Section --- */}
            <Grid.Col span={12}>
              <TextInput 
                label="Address" 
                placeholder="Address" 
                required 
                {...form.getInputProps('address')} 
              />
            </Grid.Col>

            {/* --- Contact Details Section --- */}
            <Grid.Col span={6}>
              <TextInput 
                label="Email" 
                placeholder="Email" 
                required 
                {...form.getInputProps('email')} 
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              <TextInput 
                label="Phone Number" 
                placeholder="Phone Number" 
                required 
                {...form.getInputProps('phoneNumber')} 
              />
            </Grid.Col>

            {/* --- Security Section --- */}
            <Grid.Col span={12}>
              <PasswordInput 
                label="Password" 
                placeholder="Password" 
                required 
                {...form.getInputProps('password')} 
              />
            </Grid.Col>
            
            <Grid.Col span={12}>
              <PasswordInput 
                label="Confirm Password" 
                placeholder="Confirm Password" 
                required 
                {...form.getInputProps('confirmPassword')} 
              />
            </Grid.Col>
          </Grid>

          {/* Backend Error Feedback */}
          {error && (
            <Text c="red" size="sm" mt="sm" ta="center">
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
            REGISTER
          </Button>
        </form>

        {/* Navigation Footer */}
        <Text c="dimmed" size="sm" ta="center" mt={15}>
          Already have an account?{' '}
          <Anchor component="button" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}