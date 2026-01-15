import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <Text variant="headlineMedium" style={styles.title}>
        This screen doesn't exist.
      </Text>
      <Link href="/(tabs)" asChild>
        <Button mode="contained">Go to home screen</Button>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
