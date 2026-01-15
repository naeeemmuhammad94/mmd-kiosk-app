/**
 * PIN Modal Component
 * Modal for PIN creation and verification matching Figma design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import PinInput from './PinInput';
import { usePinStore } from '@/store/usePinStore';

// Lock Icon SVG
import LockIcon from '../../../assets/Frame-lock.svg';

const PIN_LENGTH = 4;

export default function PinModal() {
    const [pin, setPin] = useState('');

    const {
        showPinModal,
        pinMode,
        isPinLoading,
        pinError,
        createPin,
        verifyPin,
        clearError,
    } = usePinStore();

    // Clear PIN when modal opens or on error
    useEffect(() => {
        if (pinError) {
            // Clear PIN on error so user can re-enter
            setPin('');
        }
    }, [pinError]);

    // Reset PIN when modal visibility changes
    useEffect(() => {
        if (showPinModal) {
            setPin('');
            clearError();
        }
    }, [showPinModal, clearError]);

    const handleConfirm = useCallback(async () => {
        if (pin.length !== PIN_LENGTH) return;

        if (pinMode === 'create') {
            await createPin(pin);
        } else {
            const success = await verifyPin(pin);
            if (!success) {
                // PIN is cleared by the useEffect above
            }
        }
    }, [pin, pinMode, createPin, verifyPin]);

    const handlePinChange = useCallback(
        (value: string) => {
            // Clear error when user starts typing
            if (pinError) {
                clearError();
            }
            setPin(value);
        },
        [pinError, clearError]
    );

    const isConfirmDisabled = pin.length !== PIN_LENGTH || isPinLoading;

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
                        {/* Lock Icon */}
                        <View style={styles.iconContainer}>
                            <LockIcon width={40} height={34} />
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

                        {/* PIN Input */}
                        <View style={styles.pinContainer}>
                            <PinInput
                                value={pin}
                                onChange={handlePinChange}
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
                                    isConfirmDisabled && styles.confirmButtonDisabled,
                                ]}
                                onPress={handleConfirm}
                                disabled={isConfirmDisabled}
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
        borderRadius: 24,
        height: 48,
        justifyContent: 'center',
        minWidth: 200,
        width: '100%',
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
        backgroundColor: '#EBF2FF',
        borderRadius: 28,
        height: 56,
        justifyContent: 'center',
        marginBottom: 16,
        width: 56,
    },
    modalContainer: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        elevation: 10,
        maxWidth: 400,
        minWidth: 320,
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
