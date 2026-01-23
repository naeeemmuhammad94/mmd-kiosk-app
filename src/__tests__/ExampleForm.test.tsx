import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ExampleForm } from '../components/ui/ExampleForm';

describe('ExampleForm', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ExampleForm />);
    expect(getByText('Login Form Example')).toBeTruthy();
  });

  it('shows validation errors for empty form', async () => {
    const { getByText } = render(<ExampleForm />);
    const submitButton = getByText('Submit');

    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText(/email/i)).toBeTruthy();
    });
  });
});
