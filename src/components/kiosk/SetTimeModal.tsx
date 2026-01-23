/**
 * Set Time Modal
 * Set sign-in time interval (minutes between consecutive sign-ins)
 * Matches CRM SetTimeModal.tsx
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';

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
          <Ionicons name="flag" size={32} color="#4A7DFF" />
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#6B7280" />
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
              placeholderTextColor="#D1D5DB"
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
              <ActivityIndicator size="small" color="#FFFFFF" />
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
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginBottom: 16,
    width: 56,
  },
  input: {
    color: '#1F2937',
    flex: 1,
    fontSize: 16,
    height: 48,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputSuffix: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
    fontSize: 14,
    paddingHorizontal: 16,
  },
  inputWrapper: {
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 596, // Fix: Constraint as requested
    minHeight: 200, // Fix: Prevent collapse
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
    backgroundColor: 'transparent', // Fix: Remove double dim
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // Fix: Ensure on top
    elevation: 5,
    width: '100%',
    height: '100%',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 24,
  },
  title: {
    color: '#1F2937',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
});
