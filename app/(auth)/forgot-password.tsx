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
    Dimensions,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '@/services/authService';
import Ionicons from '@expo/vector-icons/Ionicons';

// MMD Logo SVG
import LoginLogo from '../../assets/login.svg';

// Background Image
const backgroundImage = require('../../assets/login-background.jpg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Forgot password schema with userName (matching CRM)
const forgotPasswordSchema = z.object({
    userName: z.string().min(1, 'Username is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
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
            forgotPasswordMutation.mutate({ userName: submittedEmail }, {
                onSuccess: () => {
                    setResendSuccess(true);
                    // Hide success message after 3 seconds
                    setTimeout(() => setResendSuccess(false), 3000);
                },
            });
        }
    }, [submittedEmail, forgotPasswordMutation]);

    return (
        <View style={styles.container}>
            {/* Background Image with Overlay */}
            <ImageBackground
                source={backgroundImage}
                style={styles.background}
                resizeMode="cover"
            >
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
                            <View style={styles.card}>
                                {/* MMD Logo with Blue Gradient Background */}
                                <View style={styles.logoContainer}>
                                    <LinearGradient
                                        colors={['#4A90D9', '#5EA0E8', '#72B0F5']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.logoGradient}
                                    >
                                        <LoginLogo width={SCREEN_WIDTH * 0.65} height={90} />
                                    </LinearGradient>
                                </View>

                                {isSuccess ? (
                                    // Success State
                                    <>
                                        {/* Success Header - Checkmark and Title in same row */}
                                        <View style={styles.successHeader}>
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={28}
                                                color="#22C55E"
                                            />
                                            <Text style={styles.successTitle}>Forgot Password</Text>
                                        </View>

                                        {/* Success Message */}
                                        <Text style={styles.successDescription}>
                                            We've sent a password reset link to{"\n"}your email address
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
                                            style={styles.secondaryButton}
                                            disabled={forgotPasswordMutation.isPending}
                                        >
                                            <Text style={styles.secondaryButtonText}>
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
                                            Enter your registered email address.{'\n'}We'll send you a
                                            password reset link.
                                        </Text>

                                        {/* Username/Email Input */}
                                        <Controller
                                            control={control}
                                            name="userName"
                                            render={({ field: { onChange, onBlur, value } }) => (
                                                <View style={styles.inputContainer}>
                                                    <RNTextInput
                                                        style={[
                                                            styles.input,
                                                            errors.userName && styles.inputError,
                                                        ]}
                                                        placeholder="Enter your email"
                                                        placeholderTextColor="#9CA3AF"
                                                        value={value}
                                                        onChangeText={(text) => {
                                                            onChange(text);
                                                            if (apiError) setApiError(null);
                                                        }}
                                                        onBlur={onBlur}
                                                        autoCapitalize="none"
                                                        autoComplete="username"
                                                        editable={!forgotPasswordMutation.isPending}
                                                    />
                                                    {errors.userName && (
                                                        <Text style={styles.errorText}>
                                                            {errors.userName.message}
                                                        </Text>
                                                    )}
                                                    {apiError && !errors.userName && (
                                                        <Text style={styles.errorText}>
                                                            {apiError}
                                                        </Text>
                                                    )}
                                                </View>
                                            )}
                                        />

                                        {/* Send Reset Link Button */}
                                        <TouchableOpacity
                                            style={[
                                                styles.primaryButton,
                                                forgotPasswordMutation.isPending &&
                                                styles.primaryButtonDisabled,
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
                                        <TouchableOpacity
                                            onPress={handleBackToLogin}
                                            style={styles.backToLoginButton}
                                        >
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
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(107, 114, 128, 0.5)',
    },
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
        color: '#4A7DFF',
        fontSize: 14,
        fontWeight: '500',
    },
    background: {
        flex: 1,
    },
    card: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        elevation: 8,
        paddingHorizontal: 24,
        paddingVertical: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
    },
    container: {
        flex: 1,
    },
    description: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        marginBottom: 24,
        textAlign: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginLeft: 4,
        marginTop: 4,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderRadius: 8,
        borderWidth: 1,
        color: '#1F2937',
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
        borderColor: '#EF4444',
    },
    keyboardView: {
        flex: 1,
    },
    logoContainer: {
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
        width: '100%',
    },
    logoGradient: {
        alignItems: 'center',
        borderRadius: 16,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: '#4A7DFF',
        borderRadius: 10,
        elevation: 4,
        height: 52,
        justifyContent: 'center',
        shadowColor: '#4A7DFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        width: '100%',
    },
    primaryButtonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
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
    secondaryButton: {
        marginTop: 16,
        paddingVertical: 8,
    },
    secondaryButtonText: {
        color: '#4A7DFF',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    skipText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    successDescription: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        marginBottom: 24,
        textAlign: 'center',
    },
    successIconContainer: {
        marginBottom: 16,
    },
    title: {
        color: '#1F2937',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    successHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    successTitle: {
        color: '#1F2937',
        fontSize: 22,
        fontWeight: '700',
    },
});
