import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

interface ThemeState {
  theme: 'light' | 'dark' | 'auto';
  colorScheme: ColorSchemeName;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export const useThemeStore = create<ThemeState>((set, _get) => {
  const colorScheme = Appearance.getColorScheme();

  // Listen to system theme changes
  Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
    set({ colorScheme: newColorScheme });
  });

  return {
    theme: 'auto',
    colorScheme,
    setTheme: theme => set({ theme }),
  };
});
