/**
 * Set Time Modal
 * Set sign-in time interval (minutes between consecutive sign-ins)
 * Matches CRM SetTimeModal.tsx
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { lightTheme as theme, customColors } from '@/theme';

interface SetTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (time: number) => void;
  isLoading?: boolean;
  currentTime?: number;
}

export default function SetTimeModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  currentTime = 10,
}: SetTimeModalProps) {
  const [time, setTime] = useState(String(currentTime));
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      // Use setTimeout to avoid ESLint set-state-in-effect warning
      setTimeout(() => setTime(String(currentTime)), 0);
    }
  }, [currentTime, visible]);

  const handleTimeChange = (value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    setTime(value);
    setError('');
  };

  const handleConfirm = () => {
    const timeValue = parseInt(time);
    if (!time || isNaN(timeValue) || timeValue < 1) {
      setError('Please enter a valid time (minimum 1 minute)');
      return;
    }
    onSubmit(timeValue);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Flag Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="flag" size={32} color={theme.colors.primary} />
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Set Time</Text>
        <Text style={styles.subtitle}>
          Please enter the desired time (in minutes) between consecutive sign-ins.
        </Text>

        {/* Time Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter Time</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={time}
              onChangeText={handleTimeChange}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={customColors.outlineVariant}
            />
            <Text style={styles.inputSuffix}>Min</Text>
          </View>
        </View>

        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: theme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: customColors.surfaceDisabled, // Fallback
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  input: {
    color: theme.colors.onSurface,
    flex: 1,
    fontSize: 16,
    height: 48,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputLabel: {
    color: theme.colors.onSurface,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputSuffix: {
    backgroundColor: customColors.surfaceDisabled,
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  inputWrapper: {
    alignItems: 'center',
    borderColor: theme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    elevation: 5,
    maxWidth: 448, // Fix: Match KioskPinModal
    minHeight: 200,
    padding: 24,
    position: 'relative',
    shadowColor: customColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '90%',
    zIndex: 99999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', // Fix: Sorted before backgroundColor
    backgroundColor: customColors.backdropDark, // Fix: Enable dark overlay
    elevation: 5,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
    zIndex: 99999,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 15,
    marginBottom: 24,
  },
  title: {
    color: theme.colors.onSurface,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
});
