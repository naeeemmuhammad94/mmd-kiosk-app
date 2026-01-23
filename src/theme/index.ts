import { MD3LightTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4A7DFF', // App Primary Blue
    secondary: '#5EA0E8', // Light Blue
    tertiary: '#018786',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSurface: '#1F2937', // Text Gray 800
    onSurfaceVariant: '#6B7280', // Text Gray 500
    outline: '#E5E7EB', // Border Gray 200
  },
  fonts: configureFonts({ config: fontConfig }),
};

// Dark theme (mirrors light theme for now - can be customized later)
export const darkTheme: MD3Theme = {
  ...lightTheme,
};

export const customColors = {
  shadow: '#000000',
  backdrop: 'rgba(107, 114, 128, 0.5)',
  backdropDark: 'rgba(0, 0, 0, 0.5)',
  backdropLight: 'rgba(255, 255, 255, 0.95)',
  surfaceDisabled: '#F3F4F6',
  onSurfaceDisabled: '#9CA3AF',
  outlineVariant: '#D1D5DB',
  white: '#FFFFFF',
  textGray: '#1F2937',
  textLight: '#6B7280',
  primary: '#4A7DFF',
};

export type AppTheme = typeof lightTheme;
