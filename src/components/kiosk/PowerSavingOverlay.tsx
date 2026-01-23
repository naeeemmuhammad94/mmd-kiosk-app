/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Power Saving Overlay
 * Dims the screen after inactivity period
 * Matches CRM power saving mode functionality
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, AppState } from 'react-native';
import { useKioskStore } from '@/store/useKioskStore';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function PowerSavingOverlay() {
  const { settings } = useKioskStore();
  const [isDimmed, setIsDimmed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const resetTimeout = () => {
    setIsDimmed(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set new timeout if power saving is enabled
    if (settings?.powerSavingMode) {
      timeoutRef.current = setTimeout(() => {
        setIsDimmed(true);
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, reset timer
        resetTimeout();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [settings?.powerSavingMode]);

  // Initialize timeout when power saving mode changes
  useEffect(() => {
    if (settings?.powerSavingMode) {
      resetTimeout();
    } else {
      setIsDimmed(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [settings?.powerSavingMode]);

  // Handle user interaction to dismiss overlay
  const handlePress = () => {
    resetTimeout();
  };

  // Don't render if power saving is disabled or not dimmed
  if (!settings?.powerSavingMode || !isDimmed) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.overlay} />
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(71, 85, 105, 0.8)',
    zIndex: 9999,
  },
});
