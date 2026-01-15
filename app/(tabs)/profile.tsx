import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Switch,
  List,
  useTheme,
} from 'react-native-paper';
import { useAppStore } from '@/store/useAppStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, clearUser } = useAppStore();
  const { theme: themeMode, setTheme } = useThemeStore();
  const { isDark } = useAppTheme();

  const handleLogout = () => {
    clearUser();
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Profile</Title>
            {user ? (
              <>
                <Paragraph>Name: {user.name}</Paragraph>
                <Paragraph>Email: {user.email}</Paragraph>
                <Button
                  mode="outlined"
                  onPress={handleLogout}
                  style={styles.button}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Paragraph>Please log in to view your profile</Paragraph>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Settings</Title>
            <List.Item
              title="Dark Mode"
              description="Toggle dark theme"
              right={() => (
                <Switch value={isDark} onValueChange={toggleTheme} />
              )}
            />
            <List.Item
              title="Theme Mode"
              description={`Current: ${themeMode}`}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
