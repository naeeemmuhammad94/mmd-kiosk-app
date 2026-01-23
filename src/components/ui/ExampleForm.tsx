/* eslint-disable react-native/no-raw-text */
import React from 'react';
import { StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextInput, Card, Title, Paragraph } from 'react-native-paper';
import { loginSchema, type LoginFormData } from '@/utils/validation';
import { lightTheme as theme } from '@/theme';

export const ExampleForm: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Form data:', data);
    // Handle form submission
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{'Login Form Example'}</Title>
        <Paragraph>{'Example form using React Hook Form + Zod'}</Paragraph>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Email"
              mode="outlined"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          )}
        />
        {errors.email && <Paragraph style={styles.error}>{errors.email.message}</Paragraph>}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Password"
              mode="outlined"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.password}
              secureTextEntry
              style={styles.input}
            />
          )}
        />
        {errors.password && <Paragraph style={styles.error}>{errors.password.message}</Paragraph>}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.button}
        >
          {'Submit'}
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
  card: {
    margin: 16,
  },
  error: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
});
