/**
 * PIN Store - Zustand store for PIN quick login feature
 * Stores PIN securely using expo-secure-store
 */

import { create } from 'zustand';
import { attendanceService } from '@/services/attendanceService';
import type { PinState } from '@/types/auth';

interface PinActions {
  createPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  checkPinStatus: () => Promise<void>;
  setPinLoading: (loading: boolean) => void;
  showCreatePinModal: () => void;
  showVerifyPinModal: () => void;
  hidePinModal: () => void;
  clearError: () => void;
  reset: () => void;
}

type PinStore = PinState & PinActions;

const initialState: PinState = {
  isPinSet: false,
  isPinVerified: false,
  showPinModal: false,
  pinMode: 'create',
  isPinLoading: false,
  pinError: null,
};

export const usePinStore = create<PinStore>((set, _get) => ({
  ...initialState,

  /**
   * Check if user has a PIN set by fetching settings from server
   */
  checkPinStatus: async () => {
    set({ isPinLoading: true });
    try {
      const response = await attendanceService.getKioskSettingsByDojo();
      const settings = response.data;

      // Check if pin field exists and is not empty in the settings
      const hasPin = !!(settings && settings.pin && settings.pin.length > 0);

      set({
        isPinSet: hasPin,
        isPinLoading: false,
      });
    } catch (error) {
      console.error('[PinStore] Error checking PIN status:', error);
      // Ensure state is reset on error
      set({
        isPinSet: false,
        isPinLoading: false,
      });
      // Re-throw so the caller knows the check failed (e.g., network error)
      throw error;
    }
  },

  /**
   * Verify PIN against the server
   */
  verifyPin: async (pin: string) => {
    set({ isPinLoading: true, pinError: null });
    try {
      const response = await attendanceService.confirmKioskPin({ pin });

      if (response.success) {
        set({
          isPinVerified: true,
          showPinModal: false,
          isPinLoading: false,
          pinError: null,
        });
        return true;
      } else {
        set({
          isPinLoading: false,
          pinError: 'Incorrect PIN',
        });
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Check if it's an expected 400 error (Wrong PIN)
      if (error.response && error.response.status === 400) {
        // Log as info/debug, not error, to avoid LogBox popup
        console.log('[PinStore] Incorrect PIN attempt');

        set({
          isPinLoading: false,
          pinError: 'Incorrect PIN',
        });
      } else {
        // Genuine error (network, server crash, etc.)
        console.error('[PinStore] Error verifying PIN:', error);
        set({
          isPinLoading: false,
          pinError: 'Verification failed. Please check connection.',
        });
      }
      return false;
    }
  },

  /**
   * Create/Update PIN on the server
   */
  createPin: async (pin: string) => {
    set({ isPinLoading: true, pinError: null });
    try {
      // First we need the current settings ID to update it
      // We fetch the latest settings to ensure we have the ID and don't overwrite other fields blindly
      const settingsResponse = await attendanceService.getKioskSettingsByDojo();
      const currentSettings = settingsResponse.data;

      if (!currentSettings || !currentSettings._id) {
        throw new Error('Could not retrieve kiosk settings');
      }

      // Update parameters matching the API structure
      // We send the PIN update. In a real scenario, we might want to preserve other settings.
      // Assuming the API handles partial updates or we send back what we received + new PIN.
      await attendanceService.updateKioskSettings(currentSettings._id, {
        ...currentSettings,
        pin: pin,
      });

      set({
        isPinSet: true,
        isPinVerified: true, // Auto-verify after creation
        showPinModal: false,
        isPinLoading: false,
      });
    } catch (error) {
      console.error('[PinStore] Error creating PIN:', error);
      set({
        isPinLoading: false,
        pinError: 'Failed to save PIN. Please try again.',
      });
    }
  },

  setPinLoading: (loading: boolean) => {
    set({ isPinLoading: loading });
  },

  showCreatePinModal: () => {
    set({
      showPinModal: true,
      pinMode: 'create',
      pinError: null,
    });
  },

  showVerifyPinModal: () => {
    set({
      showPinModal: true,
      pinMode: 'verify',
      pinError: null,
    });
  },

  hidePinModal: () => {
    set({ showPinModal: false, pinError: null });
  },

  clearError: () => {
    set({ pinError: null });
  },

  reset: () => {
    set(initialState);
  },
}));

export default usePinStore;
