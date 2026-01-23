/**
 * Change PIN Modal
 * Allows setting/changing kiosk PIN
 * OPTIMIZED: Uses useRef for PIN values - no state updates during typing
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ChangePinModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  isLoading?: boolean;
  isFirstTime?: boolean;
  currentPin?: string;
}

export default function ChangePinModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  isFirstTime = false,
  currentPin = '',
}: ChangePinModalProps) {
  const pinValuesRef = useRef(['', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [error, setError] = useState('');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (visible) {
      if (currentPin && currentPin.length === 4) {
        pinValuesRef.current = currentPin.split('');
      } else {
        pinValuesRef.current = ['', '', '', ''];
      }
      // Use setTimeout to avoid ESLint set-state-in-effect warning
      setTimeout(() => forceUpdate(n => n + 1), 0);
    }
  }, [currentPin, visible]);

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
    const pinString = pinValuesRef.current.join('');
    if (pinString.length !== 4) {
      setError('Please enter complete PIN');
      return;
    }
    onSubmit(pinString);
  }, [onSubmit]);

  const handleClose = useCallback(() => {
    pinValuesRef.current = ['', '', '', ''];
    inputRefs.current.forEach(input => input?.clear());
    setError('');
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={32} color="#4A7DFF" />
        </View>
        {!isFirstTime && (
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{isFirstTime ? 'Set PIN' : 'Set/Change PIN'}</Text>
        <Text style={styles.subtitle}>
          {isFirstTime
            ? 'Please set a PIN to secure your kiosk settings.'
            : 'Set or change your kiosk PIN here.'}
        </Text>
        <View style={styles.pinContainer}>
          {[0, 1, 2, 3].map(index => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.pinInput, error && styles.pinInputError]}
              defaultValue={currentPin?.[index] || ''}
              onChangeText={value => handlePinChange(value, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0 && visible}
              placeholder="0"
              placeholderTextColor="#D1D5DB"
              selectTextOnFocus
            />
          ))}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.buttonContainer}>
          {!isFirstTime && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.confirmButton, isFirstTime && styles.confirmButtonFull]}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    paddingVertical: 14,
  },
  cancelButtonText: { color: '#6B7280', fontSize: 16, fontWeight: '500' },
  closeButton: { position: 'absolute', right: 16, top: 16, zIndex: 100000 },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
  },
  confirmButtonFull: { flex: 1 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 16, textAlign: 'center' },
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
    width: '90%',
    maxWidth: 448, // Match KioskPinModal
    padding: 24,
    position: 'relative',
    zIndex: 99999, // Fix: Force to top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Match KioskPinModal dim
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 5,
    width: '100%',
    height: '100%',
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
  subtitle: { color: '#6B7280', fontSize: 15, marginBottom: 24 },
  title: { color: '#1F2937', fontSize: 22, fontWeight: '700', marginBottom: 8 },
});
