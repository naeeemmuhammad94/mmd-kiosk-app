/**
 * PIN Input Component
 * 4-digit PIN input with auto-focus progression
 * OPTIMIZED: Uses useRef for values - no state updates during typing
 */

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { lightTheme, customColors } from '@/theme';

interface PinInputProps {
  onComplete: (pin: string) => void;
  onClear?: () => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface PinInputRef {
  clear: () => void;
  getPin: () => string;
  focus: () => void;
}

const PIN_LENGTH = 4;

const PinInput = forwardRef<PinInputRef, PinInputProps>(
  ({ onComplete, onClear, error = false, disabled = false, autoFocus = true }, ref) => {
    // Use REFS for PIN values - no re-renders during typing
    const pinValuesRef = useRef<string[]>(['', '', '', '']);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      clear: () => {
        pinValuesRef.current = ['', '', '', ''];
        inputRefs.current.forEach(input => input?.clear());
        inputRefs.current[0]?.focus();
      },
      getPin: () => pinValuesRef.current.join(''),
      focus: () => inputRefs.current[0]?.focus(),
    }));

    // Focus first input on mount if autoFocus is true
    useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    }, [autoFocus]);

    const handleChange = useCallback(
      (text: string, index: number) => {
        // Only allow single digit
        const digit = text.replace(/[^0-9]/g, '').slice(-1);

        // Store in ref - NO STATE UPDATE
        pinValuesRef.current[index] = digit;

        // Move to next input if digit entered
        if (digit && index < PIN_LENGTH - 1) {
          inputRefs.current[index + 1]?.focus();
        }

        // Check if PIN is complete
        const pin = pinValuesRef.current.join('');
        if (pin.length === PIN_LENGTH) {
          onComplete(pin);
        }
      },
      [onComplete]
    );

    const handleKeyPress = useCallback(
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        // Move to previous input on backspace if current is empty
        if (e.nativeEvent.key === 'Backspace' && !pinValuesRef.current[index] && index > 0) {
          pinValuesRef.current[index - 1] = '';
          inputRefs.current[index - 1]?.clear();
          inputRefs.current[index - 1]?.focus();
          onClear?.();
        }
      },
      [onClear]
    );

    return (
      <View style={styles.container}>
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <TextInput
            key={index}
            ref={inputRef => {
              inputRefs.current[index] = inputRef;
            }}
            style={[styles.input, error && styles.inputError, disabled && styles.inputDisabled]}
            defaultValue=""
            onChangeText={text => handleChange(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!disabled}
            secureTextEntry
            selectTextOnFocus
            caretHidden
          />
        ))}
      </View>
    );
  }
);

PinInput.displayName = 'PinInput';

export default PinInput;

const colors = lightTheme.colors;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: 14,
    borderWidth: 1.5,
    color: colors.onSurface,
    fontSize: 26,
    fontWeight: '600',
    height: 64, // Increased size
    textAlign: 'center',
    width: 64, // Increased size
  },
  inputDisabled: {
    backgroundColor: customColors.surfaceDisabled, // Gray 100
    opacity: 0.7,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
});
