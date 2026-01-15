/**
 * Root Layout
 * Main app layout with auth routing and PIN verification
 */

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet } from 'react-native';
import { queryClient } from '@/services/api';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { usePinStore } from '@/store/usePinStore';
import PinModal from '@/components/auth/PinModal';

/**
 * Hook to handle initial route based on auth/onboarding/PIN state
 */
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();

  const { isAuthenticated, isInitialized: authInitialized } = useAuthStore();
  const { isOnboardingComplete } = useOnboardingStore();
  const { isPinSet, isPinVerified, showPinModal, showVerifyPinModal, showCreatePinModal } = usePinStore();

  useEffect(() => {
    if (!authInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    // First time user - show onboarding
    if (!isOnboardingComplete && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // Onboarding complete but not authenticated - show login
    if (isOnboardingComplete && !isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // If PIN modal is currently showing, don't do any navigation
    if (showPinModal) {
      return;
    }

    // Authenticated user with PIN set but not verified - show PIN verification modal
    // First ensure we're on login screen (not onboarding) as background
    if (isAuthenticated && isPinSet && !isPinVerified) {
      const currentPath = segments.join('/');
      if (!currentPath.includes('login')) {
        router.replace('/(auth)/login');
        return;
      }
      showVerifyPinModal();
      return;
    }

    // Authenticated user WITHOUT PIN - show PIN creation modal
    if (isAuthenticated && !isPinSet && inAuthGroup) {
      showCreatePinModal();
      return;
    }

    // Authenticated user with PIN verified - navigate to main app
    if (isAuthenticated && isPinSet && isPinVerified && inAuthGroup) {
      router.replace('/(tabs)');
      return;
    }
  }, [authInitialized, isAuthenticated, isOnboardingComplete, isPinSet, isPinVerified, showPinModal, segments, router, showVerifyPinModal, showCreatePinModal]);
}

export default function RootLayout() {
  const { theme, isDark } = useAppTheme();
  const [isReady, setIsReady] = useState(false);

  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);
  const loadOnboardingState = useOnboardingStore(
    (state) => state.loadOnboardingState
  );
  const loadPinState = usePinStore((state) => state.loadPinState);

  /**
   * Initialize app state on mount
   */
  useEffect(() => {
    async function initializeApp() {
      try {
        await Promise.all([
          loadStoredAuth(),
          loadOnboardingState(),
          loadPinState(),
        ]);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    }

    initializeApp();
  }, [loadStoredAuth, loadOnboardingState, loadPinState]);

  // Use protected route hook
  useProtectedRoute();

  // Show loading spinner while initializing
  if (!isReady) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          {/* PIN Modal - rendered globally for PIN verification */}
          <PinModal />
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
