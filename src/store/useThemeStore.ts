import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: 'light' | 'dark' | 'auto';
  colorScheme: ColorSchemeName;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, _get) => {
      const colorScheme = Appearance.getColorScheme();

      // Listen to system theme changes
      Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
        set({ colorScheme: newColorScheme });
      });

      return {
        theme: 'auto', // Default to Dark Mode as per Figma design
        colorScheme,
        setTheme: theme => set({ theme }),
      };
    },
    {
      name: 'kiosk-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ theme: state.theme }), // Only persist theme selection
    }
  )
);
