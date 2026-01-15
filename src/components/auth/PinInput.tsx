/**
 * PIN Input Component
 * 4-digit PIN input with auto-focus progression
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';

interface PinInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
}

const PIN_LENGTH = 4;

export default function PinInput({
    value,
    onChange,
    error = false,
    disabled = false,
    autoFocus = true,
}: PinInputProps) {
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Focus first input on mount if autoFocus is true
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [autoFocus]);

    // Clear inputs when value is reset
    useEffect(() => {
        if (value === '') {
            // Focus first input when cleared
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [value]);

    const handleChange = useCallback(
        (text: string, index: number) => {
            // Only allow single digit
            const digit = text.replace(/[^0-9]/g, '').slice(-1);

            // Update the value
            const newValue = value.split('');
            newValue[index] = digit;
            const updatedValue = newValue.join('').slice(0, PIN_LENGTH);
            onChange(updatedValue);

            // Move to next input if digit entered
            if (digit && index < PIN_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        },
        [value, onChange]
    );

    const handleKeyPress = useCallback(
        (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
            // Move to previous input on backspace if current is empty
            if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
                // Clear the previous value
                const newValue = value.split('');
                newValue[index - 1] = '';
                onChange(newValue.join(''));
            }
        },
        [value, onChange]
    );

    return (
        <View style={styles.container}>
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => {
                        inputRefs.current[index] = ref;
                    }}
                    style={[
                        styles.input,
                        error && styles.inputError,
                        disabled && styles.inputDisabled,
                    ]}
                    value={value[index] || ''}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
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

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderRadius: 8,
        borderWidth: 1,
        color: '#1F2937',
        fontSize: 24,
        fontWeight: '600',
        height: 56,
        textAlign: 'center',
        width: 56,
    },
    inputDisabled: {
        backgroundColor: '#F3F4F6',
        opacity: 0.7,
    },
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 2,
    },
});
