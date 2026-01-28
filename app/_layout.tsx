/**
 * Root Layout
 * Main app layout with auth routing and PIN verification
 */

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
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

import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Hook to handle initial route based on auth/onboarding/PIN state
 */
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const { isAuthenticated, isInitialized: authInitialized } = useAuthStore();
  const { isOnboardingComplete } = useOnboardingStore();
  const { isPinSet, isPinVerified, showPinModal, showVerifyPinModal, showCreatePinModal } =
    usePinStore();

  useEffect(() => {
    // Crucial: Wait for both auth to be initialized AND the root navigation to be ready
    if (!authInitialized || !navigationState?.key) return;

    const inAuthGroup = segments.includes('(auth)');
    const inOnboarding = segments.includes('onboarding');

    // First time user - show onboarding
    if (!isOnboardingComplete && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // 2. Returning user - Onboarding complete but not authenticated - show login
    if (isOnboardingComplete && !isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // 3. Returning user with PIN set - Show PIN verification on top of login
    if (isOnboardingComplete && !isAuthenticated && isPinSet && !isPinVerified && inAuthGroup) {
      showVerifyPinModal();
      return;
    }

    // 4. If PIN modal is currently showing or we are in onboarding, don't do any navigation related to PIN
    if (showPinModal || inOnboarding) {
      return;
    }

    // 5. Authenticated user with PIN set but not verified - show PIN verification modal
    // (This handles the case where session expires or user re-authenticates)
    if (isAuthenticated && isPinSet && !isPinVerified) {
      if (!inAuthGroup) {
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

    // Authenticated user with PIN verified - navigate to main kiosk app
    if (isAuthenticated && isPinSet && isPinVerified && inAuthGroup) {
      router.replace('/(kiosk)');
      return;
    }
  }, [
    authInitialized,
    navigationState?.key,
    isAuthenticated,
    isOnboardingComplete,
    isPinSet,
    isPinVerified,
    showPinModal,
    segments,
    router,
    showVerifyPinModal,
    showCreatePinModal,
  ]);
}

export default function RootLayout() {
  const { theme, isDark } = useAppTheme();
  const [isReady, setIsReady] = useState(false);

  const loadStoredAuth = useAuthStore(state => state.loadStoredAuth);
  const loadOnboardingState = useOnboardingStore(state => state.loadOnboardingState);
  const { checkPinStatus } = usePinStore();

  /**
   * Initialize app state on mount
   */
  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize stores
        await Promise.all([loadStoredAuth(), loadOnboardingState()]);

        // After auth is loaded, validate token with server
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated) {
          // Validate token - if invalid, user will be routed to login
          const isValid = await useAuthStore.getState().validateSession();
          if (isValid) {
            // Token valid - check PIN status
            await checkPinStatus();
          }
          // If not valid, validateSession already cleared auth state
          // and useProtectedRoute will redirect to login
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    }

    initializeApp();
  }, [loadStoredAuth, loadOnboardingState, checkPinStatus]);

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
    <GestureHandlerRootView style={styles.flex}>
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
              <Stack.Screen name="(kiosk)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            {/* PIN Modal - rendered globally for PIN verification */}
            <PinModal />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
