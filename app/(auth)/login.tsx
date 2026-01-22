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
    Dimensions,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { usePinStore } from '@/store/usePinStore';
import { LinearGradient } from 'expo-linear-gradient';
import PinModal from '@/components/auth/PinModal';

// MMD Logo SVG
import LoginLogo from '../../assets/login.svg';

// Background Image
const backgroundImage = require('../../assets/login-background.jpg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();
    const { loadPinState } = usePinStore();

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
            await loadPinState();
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
        Alert.alert('Reset Complete', 'Onboarding state has been reset. Restart the app to see onboarding.');
    }, []);

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
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* White Card */}
                        <View style={styles.card}>
                            {/* MMD Logo */}
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

                            {/* Title */}
                            <Text style={styles.title}>Attendance Kiosk</Text>

                            {/* Username Input - LOCAL STATE */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, errors.userName && styles.inputError]}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9CA3AF"
                                    value={userName}
                                    onChangeText={setUserName}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                    editable={!loginMutation.isPending}
                                />
                                {errors.userName && (
                                    <Text style={styles.errorText}>{errors.userName}</Text>
                                )}
                            </View>

                            {/* Password Input - LOCAL STATE */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={passwordRef}
                                    style={[styles.input, errors.password && styles.inputError]}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                    editable={!loginMutation.isPending}
                                />
                                {errors.password && (
                                    <Text style={styles.errorText}>{errors.password}</Text>
                                )}
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
                                    loginMutation.isPending && styles.loginButtonDisabled,
                                ]}
                                onPress={handleLogin}
                                disabled={loginMutation.isPending}
                                activeOpacity={0.8}
                            >
                                {loginMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Log In</Text>
                                )}
                            </TouchableOpacity>

                            {/* DEV ONLY: Reset button for testing */}
                            {__DEV__ && (
                                <TouchableOpacity
                                    style={styles.devResetButton}
                                    onPress={handleResetOnboarding}
                                >
                                    <Text style={styles.devResetText}>🔧 Reset Onboarding (Dev)</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </ImageBackground>
            {/* PIN Modal */}
            <PinModal />
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(107, 114, 128, 0.5)',
    },
    card: {
        alignItems: 'center',
        alignSelf: 'center', // Center value
        width: '100%', // Take available width up to max
        maxWidth: 596, // Rule B: 596px for Content Modals
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
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    devResetButton: {
        marginTop: 16,
        paddingVertical: 8,
    },
    devResetText: {
        color: '#9CA3AF',
        fontSize: 12,
        textAlign: 'center',
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
        color: '#1F2937',
        marginBottom: 28,
        textAlign: 'center',
    },
});
