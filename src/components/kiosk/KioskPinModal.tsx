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
  useWindowDimensions,
} from 'react-native';
import { getResponsiveDimensions } from '@/theme/dimensions';
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
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={32} color="#4A7DFF" />
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
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
                placeholderTextColor="#D1D5DB"
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.confirmButtonText, { fontSize: dims.buttonFontSize }]}>
                  Confirm
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonContainer: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    // paddingVertical removed in favor of dynamic height
  },
  cancelButtonText: { color: '#6B7280', fontWeight: '500' },
  closeButton: { position: 'absolute', right: 16, top: 16 },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    // paddingVertical removed in favor of dynamic height
  },
  confirmButtonText: { color: '#FFFFFF', fontWeight: '600' },
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center' },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxWidth: 448,
    padding: 24,
    position: 'relative',
    width: '90%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 2,
    color: '#1F2937',
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    height: 64,
    textAlign: 'center',
  },
  pinInputError: { borderColor: '#EF4444' },
  subtitle: { color: '#6B7280', marginBottom: 24 },
  title: { color: '#1F2937', fontWeight: '700', marginBottom: 8 },
});
