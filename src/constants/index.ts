export const APP_NAME = 'MMD Kiosk App';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com';

export const STORAGE_KEYS = {
  USER_TOKEN: '@user_token',
  USER_DATA: '@user_data',
  THEME_PREFERENCE: '@theme_preference',
} as const;
