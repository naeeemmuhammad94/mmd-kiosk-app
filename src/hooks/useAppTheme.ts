import { useMemo } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { lightTheme, darkTheme, lightCustomColors, darkCustomColors } from '@/theme';

export const useAppTheme = () => {
  const { theme, colorScheme } = useThemeStore();

  const isDark = useMemo(() => {
    if (theme === 'auto') {
      return colorScheme === 'dark';
    }
    return theme === 'dark';
  }, [theme, colorScheme]);

  const currentTheme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const currentCustomColors = useMemo(() => {
    return isDark ? darkCustomColors : lightCustomColors;
  }, [isDark]);

  return {
    theme: currentTheme,
    isDark,
    colors: currentTheme.colors, // Convenience accessor for paper colors
    customColors: currentCustomColors,
  };
};
