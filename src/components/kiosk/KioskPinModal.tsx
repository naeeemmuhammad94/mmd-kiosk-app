/**
 * Kiosk PIN Modal
 * PIN verification using CRM API (confirmKioskPin)
 * OPTIMIZED: Uses useRef for PIN values - no state updates during typing
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { getResponsiveDimensions } from '@/theme/dimensions';
import { lightTheme as theme, customColors } from '@/theme';
import { Text, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { useKioskStore } from '@/store/useKioskStore';
import { attendanceService } from '@/services/attendanceService';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function KioskPinModal() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const dims = getResponsiveDimensions(isTablet);
  const { closePinModal, pinPurpose, toggleSettingsModal } = useKioskStore();
  const { logout } = useAuthStore();

  // Use REFS for PIN values - no re-renders during typing
  const pinValuesRef = useRef(['', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [error, setError] = useState('');
  const [, forceUpdate] = useState(0);

  // Confirm PIN using CRM API
  const { mutate: confirmPin, isPending } = useMutation({
    mutationKey: ['confirmKioskPin'],
    mutationFn: async () => {
      const pinString = pinValuesRef.current.join('');
      if (pinString.length !== 4) {
        throw new Error('incomplete');
      }
      const response = await attendanceService.confirmKioskPin({ pin: pinString });
      return response;
    },
    onSuccess: async data => {
      if (data.success === true) {
        closePinModal();
        if (pinPurpose === 'settings') {
          toggleSettingsModal();
        } else if (pinPurpose === 'logout') {
          // Close settings modal before logging out
          toggleSettingsModal();
          await logout();
          router.replace('/(auth)/login');
        }
      } else {
        resetInputs();
        setError('Incorrect PIN');
      }
    },
    onError: (err: Error) => {
      if (err.message === 'incomplete') {
        setError('Please enter complete PIN');
      } else {
        resetInputs();
        setError('Incorrect PIN');
      }
    },
  });

  const resetInputs = useCallback(() => {
    pinValuesRef.current = ['', '', '', ''];
    inputRefs.current.forEach(input => input?.clear());
    inputRefs.current[0]?.focus();
    forceUpdate(n => n + 1);
  }, []);

  const handlePinChange = useCallback((value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    pinValuesRef.current[index] = value;
    setError('');
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !pinValuesRef.current[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    []
  );

  const handleConfirm = useCallback(() => {
    confirmPin();
  }, [confirmPin]);

  const handleClose = useCallback(() => {
    pinValuesRef.current = ['', '', '', ''];
    setError('');
    closePinModal();
  }, [closePinModal]);

  return (
    <Modal visible={true} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: dims.headerFontSize }]}>Confirm PIN</Text>
                <Text style={[styles.subtitle, { fontSize: dims.bodyFontSize }]}>
                  Enter the PIN code below in order to access settings.
                </Text>
                <View style={styles.pinContainer}>
                  {[0, 1, 2, 3].map(index => (
                    <TextInput
                      key={index}
                      ref={ref => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[styles.pinInput, error && styles.pinInputError]}
                      defaultValue=""
                      onChangeText={value => handlePinChange(value, index)}
                      onKeyPress={e => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      secureTextEntry
                      autoFocus={index === 0}
                      placeholder="0"
                      placeholderTextColor={customColors.outlineVariant}
                      selectTextOnFocus
                    />
                  ))}
                </View>
                {error && (
                  <Text style={[styles.errorText, { fontSize: dims.smallFontSize }]}>{error}</Text>
                )}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { height: dims.buttonHeight }]}
                    onPress={handleClose}
                  >
                    <Text style={[styles.cancelButtonText, { fontSize: dims.buttonFontSize }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, { height: dims.buttonHeight }]}
                    onPress={handleConfirm}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                    ) : (
                      <Text style={[styles.confirmButtonText, { fontSize: dims.buttonFontSize }]}>
                        Confirm
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonContainer: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    alignItems: 'center',
    borderColor: theme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    // paddingVertical removed for dynamic height
  },
  cancelButtonText: { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
  closeButton: { position: 'absolute', right: 16, top: 16 },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    // paddingVertical removed for dynamic height
  },
  confirmButtonText: { color: theme.colors.onPrimary, fontWeight: '600' },
  errorText: { color: theme.colors.error, marginBottom: 16, textAlign: 'center' },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: customColors.surfaceDisabled,
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    maxWidth: 448, // Reverted to match ChangePinModal
    padding: 24,
    position: 'relative',
    width: '90%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: customColors.backdropDark,
    flex: 1,
    justifyContent: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pinInput: {
    borderColor: theme.colors.outline,
    borderRadius: 12,
    borderWidth: 2,
    color: theme.colors.onSurface,
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    height: 64,
    textAlign: 'center',
  },
  pinInputError: { borderColor: theme.colors.error },
  subtitle: { color: theme.colors.onSurfaceVariant, marginBottom: 24 },
  title: { color: theme.colors.onSurface, fontWeight: '700', marginBottom: 8 },
});
