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
  validateSession: () => Promise<boolean>;
  reset: () => void;
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
   * Login with userName and password
   * Token is valid for 365 days via rememberMeDays parameter
   */
  login: async (userName: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.loginUser({
        userName,
        password,
        rememberMe: true,
        rememberMeDays: 365,
      });

      // Check if we have a valid response with data
      if (response && response.data) {
        // Token can be in multiple locations (matching CRM pattern)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseAny = response as unknown as {
          data: { accessToken?: string; token?: string; refreshToken?: string };
          token?: string;
        };
        const token = response.data.accessToken || responseAny.data.token || responseAny.token;

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
      // Clear ALL stored auth data
      await secureStorage.clearAll();

      // Reset PIN store state
      try {
        const { usePinStore } = await import('./usePinStore');
        usePinStore.getState().reset();
      } catch (error) {
        console.error('Error resetting PIN store:', error);
      }

      set({
        ...initialState,
        isInitialized: true,
      });
    }
  },

  /**
   * Validate if current token is still valid with the server
   * Returns true if valid, false if expired/invalid
   */
  validateSession: async () => {
    try {
      const isValid = await authService.validateToken();
      if (!isValid) {
        // Token expired - clear auth state and force re-login
        await secureStorage.clearAll();
        set({ ...initialState, isInitialized: true });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      await secureStorage.clearAll();
      set({ ...initialState, isInitialized: true });
      return false;
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
