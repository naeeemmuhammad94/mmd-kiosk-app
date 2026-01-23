/**
 * Forgot Password Screen - Figma Design Implementation
 * Same modal with request and success states
 * Uses userName for password reset (matching CRM pattern)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  ActivityIndicator,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { authService } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';

// MMD Logo SVG
// MMD Logo SVG
import LoginLogo from '../../assets/login.svg';
import loginBackground from '../../assets/login-background.jpg';
import { lightTheme, customColors } from '@/theme';

const colors = lightTheme.colors;

// Forgot password schema with userName (matching CRM)
const forgotPasswordSchema = z.object({
  userName: z.string().min(1, 'Username is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  // Calculate Logo Width
  // Tablet: Match inputs exactly (672 - 48px padding = 624px)
  // Mobile: Use safer logic (Screen - 112px) to prevent overflow
  const logoWidth = isTablet ? 672 - 48 : Math.min(screenWidth - 112, 400);

  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      userName: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationKey: ['forgot_password'],
    mutationFn: (data: ForgotPasswordFormData) =>
      authService.sendPasswordResetEmail({
        userName: data.userName,
        email: '', // CRM allows empty email if userName is provided
      }),
    onSuccess: () => {
      setApiError(null);
      setSubmittedEmail(getValues('userName'));
      setIsSuccess(true);
    },
    onError: (error: Error & { message?: string }) => {
      // Show error from API or default message
      const errorMessage = error?.message || 'Invalid username or email. Please try again.';
      setApiError(errorMessage);
    },
  });

  const handleSendResetLink = useCallback(
    (data: ForgotPasswordFormData) => {
      forgotPasswordMutation.mutate(data);
    },
    [forgotPasswordMutation]
  );

  const handleBackToLogin = useCallback(() => {
    router.back();
  }, [router]);

  const handleResendEmail = useCallback(() => {
    if (submittedEmail) {
      setResendSuccess(false);
      forgotPasswordMutation.mutate(
        { userName: submittedEmail },
        {
          onSuccess: () => {
            setResendSuccess(true);
            // Hide success message after 3 seconds
            setTimeout(() => setResendSuccess(false), 3000);
          },
        }
      );
    }
  }, [submittedEmail, forgotPasswordMutation]);

  return (
    <View style={styles.container}>
      {/* Background Image with Overlay */}
      <ImageBackground source={loginBackground} style={styles.background} resizeMode="cover">
        {/* Semi-transparent overlay */}
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* White Card */}
              <View
                style={[
                  styles.card,
                  { width: isTablet ? 672 : '90%', maxWidth: isTablet ? 672 : 400 },
                ]}
              >
                {/* MMD Logo with Blue Gradient Background */}
                {/* MMD Logo - Clean on White Card */}
                <View style={styles.logoContainer}>
                  <LoginLogo width={logoWidth} height={logoWidth / 3.07} />
                </View>

                {isSuccess ? (
                  // Success State
                  <>
                    {/* Success Header - Checkmark and Title in same row */}
                    <View style={styles.successHeader}>
                      <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
                      <Text style={styles.successTitle}>Forgot Password</Text>
                    </View>

                    {/* Success Message */}
                    <Text style={styles.successDescription}>
                      We&apos;ve sent a password reset link to{'\n'}your email address
                    </Text>

                    {/* Back to Login Button */}
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleBackToLogin}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.primaryButtonText}>Back to Login</Text>
                    </TouchableOpacity>

                    {/* Resend Email Link */}
                    <TouchableOpacity
                      onPress={handleResendEmail}
                      style={styles.resendButton}
                      disabled={forgotPasswordMutation.isPending}
                    >
                      <Text style={styles.resendButtonText}>
                        {forgotPasswordMutation.isPending
                          ? 'Sending...'
                          : resendSuccess
                            ? '✓ Email Sent!'
                            : 'Resend Email'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Request State
                  <>
                    {/* Title */}
                    <Text style={styles.title}>Forgot Password</Text>

                    {/* Description */}
                    <Text style={styles.description}>
                      Enter your registered email address.{'\n'}We&apos;ll send you a password reset
                      link.
                    </Text>

                    {/* Username/Email Input */}
                    <Controller
                      control={control}
                      name="userName"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputContainer}>
                          <RNTextInput
                            style={[styles.input, errors.userName && styles.inputError]}
                            placeholder="Enter your email"
                            placeholderTextColor="#9CA3AF"
                            value={value}
                            onChangeText={text => {
                              onChange(text);
                              if (apiError) setApiError(null);
                            }}
                            onBlur={onBlur}
                            autoCapitalize="none"
                            autoComplete="username"
                            editable={!forgotPasswordMutation.isPending}
                          />
                          {errors.userName && (
                            <Text style={styles.errorText}>{errors.userName.message}</Text>
                          )}
                          {apiError && !errors.userName && (
                            <Text style={styles.errorText}>{apiError}</Text>
                          )}
                        </View>
                      )}
                    />

                    {/* Send Reset Link Button */}
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        forgotPasswordMutation.isPending && styles.primaryButtonDisabled,
                      ]}
                      onPress={handleSubmit(handleSendResetLink)}
                      disabled={forgotPasswordMutation.isPending}
                      activeOpacity={0.8}
                    >
                      {forgotPasswordMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                      )}
                    </TouchableOpacity>

                    {/* Back to Login Link */}
                    <TouchableOpacity onPress={handleBackToLogin} style={styles.backToLoginButton}>
                      <Ionicons
                        name="arrow-back"
                        size={16}
                        color="#4A7DFF"
                        style={styles.backArrow}
                      />
                      <Text style={styles.backToLoginText}>Back to Login</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backArrow: {
    marginRight: 6,
  },
  backToLoginButton: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
    paddingVertical: 8,
  },
  backToLoginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  background: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.background,
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
  container: {
    flex: 1,
  },
  description: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },

  errorText: {
    color: colors.error,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.onSurface,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 16,
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  inputError: {
    borderColor: colors.error,
  },
  keyboardView: {
    flex: 1,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '100%',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
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
  successDescription: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  successHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  successTitle: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
