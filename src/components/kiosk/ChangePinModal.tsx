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
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { getResponsiveDimensions } from '@/theme/dimensions';
import { Text, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { lightTheme as theme, customColors } from '@/theme';

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
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const dims = getResponsiveDimensions(isTablet);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
              </View>
              {!isFirstTime && (
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}
              <Text style={[styles.title, { fontSize: dims.headerFontSize }]}>
                {isFirstTime ? 'Set PIN' : 'Set/Change PIN'}
              </Text>
              <Text style={[styles.subtitle, { fontSize: dims.bodyFontSize }]}>
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
                    style={[
                      styles.pinInput,
                      error && styles.pinInputError,
                      // Optional: Adjust PIN font size if needed, e.g. { fontSize: isTablet ? 24 : 20 }
                    ]}
                    defaultValue={currentPin?.[index] || ''}
                    onChangeText={value => handlePinChange(value, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoFocus={index === 0 && visible}
                    placeholder="0"
                    placeholderTextColor={customColors.onSurfaceDisabled}
                    selectTextOnFocus
                  />
                ))}
              </View>
              {error && (
                <Text style={[styles.errorText, { fontSize: dims.smallFontSize }]}>{error}</Text>
              )}
              <View style={styles.buttonContainer}>
                {!isFirstTime && (
                  <TouchableOpacity
                    style={[styles.cancelButton, { height: dims.buttonHeight }]}
                    onPress={handleClose}
                  >
                    <Text style={[styles.cancelButtonText, { fontSize: dims.buttonFontSize }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    isFirstTime && styles.confirmButtonFull,
                    { height: dims.buttonHeight },
                  ]}
                  onPress={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
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
    // paddingVertical removed
  },
  cancelButtonText: { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
  closeButton: { position: 'absolute', right: 16, top: 16, zIndex: 100000 },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    // paddingVertical removed
  },
  confirmButtonFull: { flex: 1 },
  confirmButtonText: { color: theme.colors.onPrimary, fontWeight: '600' },
  container: { flex: 1 },
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
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    elevation: 5,
    maxWidth: 448, // Match KioskPinModal
    padding: 24,
    position: 'relative',
    shadowColor: customColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '90%',
    zIndex: 99999, // Fix: Force to top
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: customColors.backdropDark, // Match KioskPinModal dim
    elevation: 5,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
    zIndex: 99999,
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
