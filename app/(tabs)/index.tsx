import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
/* eslint-disable react-native/no-raw-text */
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Text, useTheme } from 'react-native-paper';
import { useAuthStore } from '@/store/useAuthStore';
import { usePinStore } from '@/store/usePinStore';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const { reset: resetPin } = usePinStore();

  const handleLogout = useCallback(async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Logout clears both auth tokens and PIN
            await logout();
            // Reset PIN store state to match cleared storage
            await resetPin();
            // Navigate to login
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  }, [logout, resetPin, router]);

  const userName = user?.user?.firstName || user?.user?.email || 'User';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Welcome, {userName}!</Title>
            <Paragraph>You are logged in to MMD Kiosk App.</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Test Authentication</Title>
            <Paragraph style={styles.infoText}>
              Use the logout button below to test different authentication flows:
            </Paragraph>
            <Text style={styles.bulletPoint}>• Logout and login again</Text>
            <Text style={styles.bulletPoint}>• Close app and reopen to test PIN verification</Text>

            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor="#EF4444"
              loading={isLoading}
              disabled={isLoading}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bulletPoint: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 8,
  },
  card: {
    marginBottom: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  infoText: {
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 16,
  },
});
