/**
 * Auth Store - Zustand store for authentication state
 */

import { create } from 'zustand';
import { secureStorage } from '@/services/axios';
import { authService } from '@/services/authService';
import type { CurrentUser, AuthState } from '@/types/auth';

interface AuthActions {
    login: (userName: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: CurrentUser | null) => void;
    setToken: (token: string | null) => void;
    loadStoredAuth: () => Promise<void>;
    reset: () => void;
    loginWithSavedCredentials: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
};

export const useAuthStore = create<AuthStore>((set, _get) => ({
    ...initialState,

    /**
     * Login with userName and password (matching CRM pattern)
     */
    login: async (userName: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await authService.loginUser({
                userName,
                password,
                rememberMe: true,
            });

            // Check if we have a valid response with data
            if (response && response.data) {
                // Token can be in multiple locations (matching CRM pattern)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const responseAny = response as unknown as { data: { accessToken?: string; token?: string; refreshToken?: string }; token?: string };
                const token =
                    response.data.accessToken ||
                    responseAny.data.token ||
                    responseAny.token;

                const refreshToken = response.data.refreshToken;
                const userData = response.data;

                // Store tokens securely
                if (token && typeof token === 'string') {
                    await secureStorage.setToken(token);
                }
                if (refreshToken && typeof refreshToken === 'string') {
                    await secureStorage.setRefreshToken(refreshToken);
                }

                // Store only essential user data to avoid SecureStore size limit (2048 bytes)
                // Access nested user object if present, or use direct properties
                const userInfo = userData.user || userData;
                const essentialUserData = {
                    _id: (userInfo as { _id?: string })._id || '',
                    email: (userInfo as { email?: string }).email || '',
                    fullName: (userInfo as { firstName?: string; lastName?: string }).firstName || '',
                };
                await secureStorage.setUserData(JSON.stringify(essentialUserData));
                await secureStorage.setSavedCredentials(userName, password);

                set({
                    user: { ...userData, accessToken: token as string },
                    token: (token as string) || null,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                const errorMessage = response?.message || 'Login failed - no data received';
                throw new Error(errorMessage);
            }
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    /**
     * Logout user and clear all stored data including PIN
     */
    logout: async () => {
        set({ isLoading: true });
        try {
            await authService.logoutUser();
        } catch {
            // Continue with local logout even if API fails
        } finally {
            // Clear ALL stored auth credentials, including saved username/password
            await secureStorage.clearEverything();

            // Reset PIN store state
            // Import dynamically to avoid circular dependencies if any
            const { usePinStore } = await import('./usePinStore');
            await usePinStore.getState().reset();

            set({
                ...initialState,
                isInitialized: true,
            });
        }
    },

    /**
     * Automated login using saved credentials (for PIN-based login)
     */
    loginWithSavedCredentials: async () => {
        const { userName, password } = await secureStorage.getSavedCredentials();
        if (userName && password) {
            const useAuthStore = (await import('./useAuthStore')).default;
            await useAuthStore.getState().login(userName, password);
        } else {
            throw new Error('No saved credentials found');
        }
    },

    /**
     * Set user data
     */
    setUser: (user: CurrentUser | null) => {
        set({
            user,
            isAuthenticated: !!user,
        });
    },

    /**
     * Set auth token
     */
    setToken: (token: string | null) => {
        set({ token });
    },

    /**
     * Load authentication state from secure storage
     */
    loadStoredAuth: async () => {
        try {
            const [token, userData] = await Promise.all([
                secureStorage.getToken(),
                secureStorage.getUserData(),
            ]);

            if (token && userData) {
                const parsedUser = JSON.parse(userData) as CurrentUser;
                set({
                    user: { ...parsedUser, accessToken: token },
                    token,
                    isAuthenticated: true,
                    isInitialized: true,
                });
            } else {
                set({ isInitialized: true });
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
            set({ isInitialized: true });
        }
    },

    /**
     * Reset store to initial state
     */
    reset: () => {
        set({ ...initialState, isInitialized: true });
    },
}));

export default useAuthStore;
