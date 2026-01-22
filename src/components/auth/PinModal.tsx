/**
 * PIN Modal Component
 * Modal for PIN creation and verification matching Figma design
 * OPTIMIZED: Uses ref-based PinInput for instant response
 */

import React, { useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import PinInput, { PinInputRef } from './PinInput';
import { usePinStore } from '@/store/usePinStore';
import { useAuthStore } from '@/store/useAuthStore';

// Lock Icon SVG
import LockIcon from '../../../assets/lock.svg';

export default function PinModal() {
    const pinInputRef = useRef<PinInputRef>(null);

    const { isAuthenticated, loginWithSavedCredentials } = useAuthStore();
    const {
        showPinModal,
        pinMode,
        isPinLoading,
        pinError,
        createPin,
        verifyPin,
        setPinLoading,
        clearError,
    } = usePinStore();

    const handlePinComplete = useCallback(() => {
        // PIN will be used when confirm is pressed
    }, []);

    const handlePinClear = useCallback(() => {
        if (pinError) {
            clearError();
        }
    }, [pinError, clearError]);

    const handleConfirm = useCallback(async () => {
        const pin = pinInputRef.current?.getPin() || '';
        if (pin.length !== 4) return;

        if (pinMode === 'create') {
            await createPin(pin);
        } else {
            const success = await verifyPin(pin);
            if (success) {
                // If this is a returning user (not authenticated yet), trigger login
                if (!isAuthenticated) {
                    try {
                        setPinLoading(true);
                        await loginWithSavedCredentials();
                    } catch (error) {
                        console.error('Direct login failed:', error);
                        // Pin store handles error visibility usually, but here we might need a custom error
                    } finally {
                        setPinLoading(false);
                    }
                }
            } else {
                // Clear the input on failed verification
                pinInputRef.current?.clear();
            }
        }
    }, [pinMode, createPin, verifyPin, isAuthenticated, loginWithSavedCredentials, setPinLoading]);

    return (
        <Modal
            visible={showPinModal}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        {/* Lock Icon - No background per Figma */}
                        <View style={styles.iconContainer}>
                            <LockIcon width={36} height={32} />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>
                            {pinMode === 'create' ? 'Create your PIN' : 'Enter your PIN'}
                        </Text>

                        {/* Subtitle */}
                        <Text style={styles.subtitle}>
                            {pinMode === 'create'
                                ? 'Create your pin to access your kiosk setting easily'
                                : 'Enter your pin to access your kiosk'}
                        </Text>

                        {/* PIN Input - Ref-based */}
                        <View style={styles.pinContainer}>
                            <PinInput
                                ref={pinInputRef}
                                onComplete={handlePinComplete}
                                onClear={handlePinClear}
                                error={!!pinError}
                                disabled={isPinLoading}
                            />
                        </View>

                        {/* Error Message */}
                        {pinError && (
                            <Text style={styles.errorText}>{pinError}</Text>
                        )}

                        {/* Confirm Button */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    isPinLoading && styles.confirmButtonDisabled,
                                ]}
                                onPress={handleConfirm}
                                disabled={isPinLoading}
                                activeOpacity={0.8}
                            >
                                {isPinLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        marginTop: 8,
        paddingHorizontal: 16,
        width: '100%',
    },
    confirmButton: {
        alignItems: 'center',
        backgroundColor: '#4A7DFF',
        borderRadius: 10,
        height: 48,
        justifyContent: 'center',
        minWidth: 160,
        paddingHorizontal: 40,
    },
    confirmButtonDisabled: {
        opacity: 0.6,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 16,
        textAlign: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalContainer: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        elevation: 10,
        width: '90%',
        maxWidth: 400,
        paddingHorizontal: 32,
        paddingVertical: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    overlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'center',
    },
    pinContainer: {
        marginBottom: 16,
    },
    subtitle: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '400',
        marginBottom: 24,
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    title: {
        color: '#4A7DFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
});
