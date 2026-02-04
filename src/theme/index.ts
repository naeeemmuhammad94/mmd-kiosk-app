import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
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

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4A7DFF', // Matching Figma Blue (was #608DFF)
    secondary: '#5EA0E8',
    tertiary: '#03DAC6',
    error: '#EF4444',
    background: '#0C111D', // Figma Background
    surface: '#161B26', // Figma Surface (Card/Modal bg)
    onPrimary: '#FFFFFF',
    onSurface: '#FFFFFF', // Text White
    onSurfaceVariant: '#9CA3AF', // Text Gray 400
    outline: '#374151', // Border Gray 700
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const lightCustomColors = {
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
  primaryContainer: '#EFF6FF',
  successContainer: '#ECFDF5',
  success: '#22C55E',
  onSuccessContainer: '#059669',
  errorContainer: '#FEF2F2',
  onErrorContainer: '#EF4444',
  warn: '#EAB308',
  whiteOpacity: 'rgba(255, 255, 255, 0.2)',
  backdropStrong: 'rgba(71, 85, 105, 0.8)',
  inputBackground: '#FFFFFF', // Request: #FFFFFF
  inputBorder: '#979797', // Request: #979797
  modalBackground: '#FFFFFF',
  modalHeaderBackground: '#4A7DFF', // Light mode blue
  backgroundAlt: '#F8F9FA',
  destructive: '#D93025',
  iconBackground: '#F1F3F4',
};

export const darkCustomColors = {
  shadow: '#000000',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  backdropDark: 'rgba(0, 0, 0, 0.85)',
  backdropLight: 'rgba(30, 30, 30, 0.95)',
  surfaceDisabled: '#161B26', // Match card surface
  onSurfaceDisabled: '#6B7280',
  outlineVariant: '#4B5563',
  white: '#FFFFFF',
  textGray: '#E5E7EB',
  textLight: '#9CA3AF',
  primary: '#4A7DFF',
  primaryContainer: '#1E3A8A',
  successContainer: '#064E3B',
  success: '#4ADE80',
  onSuccessContainer: '#D1FAE5',
  errorContainer: '#7F1D1D',
  onErrorContainer: '#FCA5A5',
  warn: '#FACC15',
  whiteOpacity: 'rgba(255, 255, 255, 0.1)',
  backdropStrong: 'rgba(12, 17, 29, 0.95)', // Match background tone #0C111D
  inputBackground: '#161B26', // Request: #161B26
  inputBorder: '#979797', // Request: #979797
  modalBackground: '#0C111D', // Request: #0C111D
  modalHeaderBackground: '#161B26', // Request: #161B26
  backgroundAlt: '#161B26',
  destructive: '#EF4444', // Lighter red for dark mode consistency, or keep #D93025 if strictly brand
  iconBackground: '#374151', // Darker grey for icons
};

// Backwards compatibility default - ideally usage should be migrated to hook
export const customColors = lightCustomColors;

export type AppTheme = typeof lightTheme;
export type CustomColors = typeof lightCustomColors;
