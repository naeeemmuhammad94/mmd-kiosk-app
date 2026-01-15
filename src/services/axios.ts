/**
 * Axios instance with interceptors for API calls
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'https://staging-api.managemydojo.com/api/v1';

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

/**
 * Configured axios instance with base URL and default headers
 */
export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

/**
 * Request interceptor to attach auth token
 */
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
            if (token && config.headers) {
                config.headers.Authorization = token;
            }
        } catch (error) {
            console.error('Error reading token from secure store:', error);
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for error handling
 */
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Clear stored credentials on unauthorized
            try {
                await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
                await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
                await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
            } catch (storageError) {
                console.error('Error clearing secure store:', storageError);
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Secure storage utility functions
 */
export const secureStorage = {
    async setToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    },

    async getToken(): Promise<string | null> {
        return SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    },

    async removeToken(): Promise<void> {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    },

    async setRefreshToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    },

    async getRefreshToken(): Promise<string | null> {
        return SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    },

    async removeRefreshToken(): Promise<void> {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    },

    async setUserData(userData: string): Promise<void> {
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, userData);
    },

    async getUserData(): Promise<string | null> {
        return SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    },

    async removeUserData(): Promise<void> {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    },

    async clearAll(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
            SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
            SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
        ]);
    },
};

export default axiosInstance;
