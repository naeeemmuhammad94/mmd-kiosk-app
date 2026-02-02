/**
 * Login Screen - Figma Design Implementation
 * Username + Password login with CRM API pattern
 * OPTIMIZED: Uses local state - no external state updates during typing
 */

import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ImageBackground,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';

// MMD Logo SVG
import LoginLogo from '../../assets/login.svg';
import loginBackground from '../../assets/login-background.png';

import { useAppTheme } from '@/hooks/useAppTheme';
import { getResponsiveDimensions } from '@/theme/dimensions';
import type { CustomColors } from '@/theme';

// colors constant removed

export default function LoginScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const { theme, customColors } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, customColors), [theme, customColors]);

  // Calculate Logo Width
  // Tablet: Match inputs exactly (672 - 48px padding = 624px)
  // Mobile: Reverted to original logic per user request, but max capped at card content width
  // This ensures logo doesn't overflow, but maintains the "visual size" user expects
  const cardContentWidth = isTablet ? 672 - 48 : Math.min(screenWidth * 0.9 - 48, 400);
  const logoWidth = isTablet ? 672 - 48 : Math.min(screenWidth - 112, cardContentWidth);

  // Responsive dimensions for mobile-first design
  const dims = getResponsiveDimensions(isTablet);

  const { login } = useAuthStore();
  // const { loadPinState } = usePinStore(); // REMOVED

  // LOCAL state - no external state updates during typing
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ userName?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  const loginMutation = useMutation({
    mutationKey: ['login'],
    mutationFn: async () => {
      // Validate before submitting
      const newErrors: typeof errors = {};
      if (!userName.trim()) newErrors.userName = 'Username is required';
      if (!password.trim()) newErrors.password = 'Password is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error('Validation failed');
      }

      await login(userName.trim(), password);
    },
    onSuccess: async () => {
      // PIN status is now checked inside useAuthStore.login before isAuthenticated is set
      // RootLayout will automatically handle showing the correct modal (Verify vs Create)
      // based on the updated store state.
    },
    onError: (error: Error & { message?: string }) => {
      if (error.message !== 'Validation failed') {
        Alert.alert(
          'Login Failed',
          error?.message || 'Please check your credentials and try again.'
        );
      }
    },
  });

  const handleLogin = useCallback(() => {
    setErrors({});
    loginMutation.mutate();
  }, [loginMutation]);

  const handleForgotPassword = useCallback(() => {
    router.push('/(auth)/forgot-password');
  }, [router]);

  // DEV ONLY: Reset onboarding state for testing
  const handleResetOnboarding = useCallback(async () => {
    await useOnboardingStore.getState().reset();
    Alert.alert(
      'Reset Complete',
      'Onboarding state has been reset. Restart the app to see onboarding.'
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Image with Overlay */}
      <ImageBackground source={loginBackground} style={styles.background} resizeMode="cover">
        {/* Semi-transparent overlay */}
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* White Card */}
              <View style={[styles.card, isTablet ? styles.cardTablet : styles.cardMobile]}>
                {/* MMD Logo */}
                <View style={styles.logoContainer}>
                  {/* Responsive Logo: Max 540px, or Inputs Width */}
                  <LoginLogo width={logoWidth} height={logoWidth / 3.07} />
                </View>

                {/* Title */}
                <Text style={[styles.title, { fontSize: dims.headerFontSize }]}>
                  Attendance Kiosk
                </Text>

                {/* Username Input - LOCAL STATE */}
                <View style={[styles.inputContainer, { width: logoWidth }, styles.centered]}>
                  <TextInput
                    style={[
                      styles.input,
                      { height: dims.inputHeight },
                      errors.userName && styles.inputError,
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={userName}
                    onChangeText={setUserName}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    editable={!loginMutation.isPending}
                  />
                  {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
                </View>

                {/* Password Input - LOCAL STATE */}
                <View style={[styles.inputContainer, { width: logoWidth }, styles.centered]}>
                  <TextInput
                    ref={passwordRef}
                    style={[
                      styles.input,
                      { height: dims.inputHeight },
                      errors.password && styles.inputError,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={!loginMutation.isPending}
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password</Text>
                </TouchableOpacity>

                {/* Log In Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    { height: dims.buttonHeight, width: logoWidth },
                    styles.centered,
                    loginMutation.isPending && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loginMutation.isPending}
                  activeOpacity={0.8}
                >
                  {loginMutation.isPending ? (
                    <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                  ) : (
                    <Text style={[styles.loginButtonText, { fontSize: dims.buttonFontSize }]}>
                      Log In
                    </Text>
                  )}
                </TouchableOpacity>

                {/* DEV ONLY: Reset button for testing */}
                {__DEV__ && (
                  <TouchableOpacity style={styles.devResetButton} onPress={handleResetOnboarding}>
                    <Text style={styles.devResetText}>🔧 Reset Onboarding (Dev)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const createStyles = (theme: MD3Theme, customColors: CustomColors) =>
  StyleSheet.create({
    background: {
      flex: 1,
    },
    card: {
      alignSelf: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      elevation: 8,
      // width and maxWidth set dynamically via inline style
      paddingHorizontal: 24,
      paddingVertical: 32,
      shadowColor: customColors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    cardMobile: {
      maxWidth: 400,
      width: '90%',
    },
    cardTablet: {
      maxWidth: 672,
      width: 672,
    },
    centered: {
      alignSelf: 'center',
    },
    container: {
      flex: 1,
    },
    devResetButton: {
      marginTop: 16,
      paddingVertical: 8,
    },
    devResetText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginLeft: 4,
      marginTop: 4,
    },
    forgotPasswordButton: {
      alignSelf: 'center',
      marginBottom: 24,
      marginTop: 8,
      paddingVertical: 8,
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    input: {
      backgroundColor: theme.colors.surface, // Use surface for input background
      borderColor: theme.colors.outline,
      borderRadius: 8,
      borderWidth: 1,
      color: theme.colors.onSurface,
      fontSize: 16,
      // height set dynamically via inline style
      paddingHorizontal: 16,
      width: '100%',
    },
    inputContainer: {
      marginBottom: 16,
      width: '100%',
    },

    inputError: {
      borderColor: theme.colors.error,
    },
    keyboardContainer: {
      flex: 1,
    },
    loginButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      elevation: 4,
      // height set dynamically via inline style
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      width: '100%',
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    loginButtonText: {
      color: theme.colors.onPrimary,
      // fontSize set dynamically via inline style
      fontWeight: '600',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 24,
      width: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: customColors.backdrop,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 24,
    },
    title: {
      color: theme.colors.onSurface, // changed from textGray
      // fontSize set dynamically via inline style
      fontWeight: '700',
      marginBottom: 28,
      textAlign: 'center',
    },
  });
