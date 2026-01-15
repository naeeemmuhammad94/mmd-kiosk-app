/**
 * Login Screen - Figma Design Implementation
 * Username + Password login with CRM API pattern
 * Shows PIN creation modal after first successful login
 */

import React, { useCallback } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
    TextInput as RNTextInput,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { usePinStore } from '@/store/usePinStore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import PinModal from '@/components/auth/PinModal';

// MMD Logo SVG
import LoginLogo from '../../assets/Frame-login.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Login schema with userName (matching CRM)
const loginSchema = z.object({
    userName: z
        .string()
        .min(1, 'Username is required')
        .max(50, 'Username is too long'),
    password: z
        .string()
        .min(1, 'Password is required')
        .max(50, 'Password is too long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();
    const { loadPinState } = usePinStore();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            userName: '',
            password: '',
        },
    });

    const loginMutation = useMutation({
        mutationKey: ['login'],
        mutationFn: async (data: LoginFormData) => {
            // Using userName for login (matching CRM pattern)
            await login(data.userName, data.password);
        },
        onSuccess: async () => {
            // After successful login, reload PIN state
            // The _layout.tsx useProtectedRoute hook will handle:
            // - Showing PIN creation modal if no PIN exists
            // - Showing PIN verification modal if PIN exists but not verified
            // - Navigating to tabs once PIN is set and verified
            await loadPinState();
        },
        onError: (error: Error & { message?: string }) => {
            Alert.alert(
                'Login Failed',
                error?.message || 'Please check your credentials and try again.'
            );
        },
    });

    const handleLogin = useCallback(
        (data: LoginFormData) => {
            loginMutation.mutate(data);
        },
        [loginMutation]
    );

    const handleForgotPassword = useCallback(() => {
        router.push('/(auth)/forgot-password');
    }, [router]);

    return (
        <View style={styles.container}>
            {/* Background gradient (placeholder for martial arts background image) */}
            <LinearGradient
                colors={['#9CA3AF', '#6B7280', '#4B5563']}
                style={styles.background}
            >
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

                                {/* Title - Black color as per Figma */}
                                <Text style={styles.title}>Attendance Kiosk</Text>

                                {/* Username Input */}
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
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                autoCapitalize="none"
                                                autoComplete="username"
                                                editable={!loginMutation.isPending}
                                            />
                                            {errors.userName && (
                                                <Text style={styles.errorText}>
                                                    {errors.userName.message}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                />

                                {/* Password Input */}
                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View style={styles.inputContainer}>
                                            <RNTextInput
                                                style={[
                                                    styles.input,
                                                    errors.password && styles.inputError,
                                                ]}
                                                placeholder="Enter your password"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                secureTextEntry
                                                autoCapitalize="none"
                                                editable={!loginMutation.isPending}
                                            />
                                            {errors.password && (
                                                <Text style={styles.errorText}>
                                                    {errors.password.message}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                />

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
                                        loginMutation.isPending && styles.loginButtonDisabled,
                                    ]}
                                    onPress={handleSubmit(handleLogin)}
                                    disabled={loginMutation.isPending}
                                    activeOpacity={0.8}
                                >
                                    {loginMutation.isPending ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Log In</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
            {/* PIN Modal for PIN creation after login */}
            <PinModal />
        </View>
    );
}

const styles = StyleSheet.create({
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
    errorText: {
        color: '#EF4444',
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
        color: '#4A7DFF',
        fontSize: 14,
        fontWeight: '500',
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
        marginBottom: 16,
        width: '100%',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    keyboardView: {
        flex: 1,
    },
    loginButton: {
        alignItems: 'center',
        backgroundColor: '#4A7DFF',
        borderRadius: 26,
        elevation: 4,
        height: 52,
        justifyContent: 'center',
        shadowColor: '#4A7DFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        width: '100%',
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    logoContainer: {
        borderRadius: 16,
        marginBottom: 20,
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
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937', // Black as per Figma
        marginBottom: 28,
        textAlign: 'center',
    },
});
