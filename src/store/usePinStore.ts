/**
 * PIN Store - Zustand store for PIN quick login feature
 * Stores PIN securely using expo-secure-store
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { PinState } from '@/types/auth';

// SecureStore keys must only contain alphanumeric characters, ".", "-", and "_"
const PIN_STORAGE_KEY = 'mmd_kiosk_pin';

interface PinActions {
    createPin: (pin: string) => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
    loadPinState: () => Promise<void>;
    clearPin: () => Promise<void>;
    showCreatePinModal: () => void;
    showVerifyPinModal: () => void;
    setPinLoading: (loading: boolean) => void;
    hidePinModal: () => void;
    clearError: () => void;
    reset: () => Promise<void>;
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

export const usePinStore = create<PinStore>((set, get) => ({
    ...initialState,

    /**
     * Create and save a new PIN
     */
    createPin: async (pin: string) => {
        set({ isPinLoading: true, pinError: null });
        try {
            await SecureStore.setItemAsync(PIN_STORAGE_KEY, pin);
            set({
                isPinSet: true,
                isPinVerified: true, // Auto-verify after creation
                showPinModal: false,
                isPinLoading: false,
            });
        } catch (error) {
            console.error('[PinStore] Error saving PIN:', error);
            set({
                isPinLoading: false,
                pinError: 'Failed to save PIN. Please try again.',
            });
        }
    },

    /**
     * Verify entered PIN against stored PIN
     */
    verifyPin: async (pin: string) => {
        set({ isPinLoading: true, pinError: null });
        try {
            const storedPin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);

            if (storedPin === pin) {
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
        } catch (error) {
            console.error('[PinStore] Error verifying PIN:', error);
            set({
                isPinLoading: false,
                pinError: 'Error verifying PIN. Please try again.',
            });
            return false;
        }
    },

    /**
     * Load PIN state from secure storage on app start
     */
    loadPinState: async () => {
        try {
            const storedPin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
            const isPinSet = !!storedPin;
            set({ isPinSet });
        } catch (error) {
            console.error('[PinStore] Error loading PIN state:', error);
            set({ isPinSet: false });
        }
    },

    /**
     * Clear stored PIN (for logout)
     */
    clearPin: async () => {
        try {
            await SecureStore.deleteItemAsync(PIN_STORAGE_KEY);
            set({
                isPinSet: false,
                isPinVerified: false,
            });
        } catch (error) {
            console.error('[PinStore] Error clearing PIN:', error);
        }
    },

    /**
     * Show PIN creation modal
     */
    showCreatePinModal: () => {
        set({
            showPinModal: true,
            pinMode: 'create',
            pinError: null,
        });
    },

    /**
     * Show PIN verification modal
     */
    showVerifyPinModal: () => {
        set({
            showPinModal: true,
            pinMode: 'verify',
            pinError: null,
        });
    },

    /**
     * Set PIN loading state manually (for auth flow)
     */
    setPinLoading: (loading: boolean) => {
        set({ isPinLoading: loading });
    },

    /**
     * Hide PIN modal
     */
    hidePinModal: () => {
        set({ showPinModal: false, pinError: null });
    },

    /**
     * Clear PIN error
     */
    clearError: () => {
        set({ pinError: null });
    },

    /**
     * Reset PIN store to initial state
     */
    reset: async () => {
        await get().clearPin();
        set(initialState);
    },
}));

export default usePinStore;
