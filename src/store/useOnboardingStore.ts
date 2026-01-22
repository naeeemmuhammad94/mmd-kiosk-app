/**
 * Onboarding Store - Zustand store for onboarding state
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingState } from '@/types/auth';

const ONBOARDING_STORAGE_KEY = '@mmd_kiosk_onboarding_complete';
const NOTIFICATION_PERMISSION_KEY = '@mmd_kiosk_notification_permission';

interface OnboardingActions {
    completeOnboarding: () => Promise<void>;
    setNotificationPermission: (granted: boolean) => Promise<void>;
    loadOnboardingState: () => Promise<void>;
    reset: () => Promise<void>;
}

type OnboardingStore = OnboardingState & OnboardingActions;

const initialState: OnboardingState = {
    isOnboardingComplete: false,
    notificationPermissionGranted: false,
    isInitialized: false,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
    ...initialState,

    /**
     * Mark onboarding as complete
     */
    completeOnboarding: async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
            set({ isOnboardingComplete: true });
        } catch (error) {
            console.error('Error saving onboarding state:', error);
        }
    },

    /**
     * Set notification permission status
     */
    setNotificationPermission: async (granted: boolean) => {
        try {
            await AsyncStorage.setItem(
                NOTIFICATION_PERMISSION_KEY,
                granted ? 'true' : 'false'
            );
            set({ notificationPermissionGranted: granted });
        } catch (error) {
            console.error('Error saving notification permission state:', error);
        }
    },

    /**
     * Load onboarding state from AsyncStorage
     */
    loadOnboardingState: async () => {
        try {
            const [onboardingComplete, notificationPermission] = await Promise.all([
                AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
                AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY),
            ]);

            set({
                isOnboardingComplete: onboardingComplete === 'true',
                notificationPermissionGranted: notificationPermission === 'true',
                isInitialized: true,
            });
        } catch (error) {
            console.error('Error loading onboarding state:', error);
            set({ isInitialized: true });
        }
    },

    /**
     * Reset onboarding state (for testing purposes)
     */
    reset: async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY),
                AsyncStorage.removeItem(NOTIFICATION_PERMISSION_KEY),
            ]);
            set(initialState);
        } catch (error) {
            console.error('Error resetting onboarding state:', error);
        }
    },
}));

export default useOnboardingStore;
