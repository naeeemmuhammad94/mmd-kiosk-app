import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { lightTheme, darkTheme } from '@/theme';

export const useAppTheme = () => {
  const _systemColorScheme = useColorScheme();
  const { theme, colorScheme } = useThemeStore();

  const currentTheme = useMemo(() => {
    if (theme === 'auto') {
      return colorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return theme === 'dark' ? darkTheme : lightTheme;
  }, [theme, colorScheme]);

  const isDark = useMemo(() => {
    if (theme === 'auto') {
      return colorScheme === 'dark';
    }
    return theme === 'dark';
  }, [theme, colorScheme]);

  return {
    theme: currentTheme,
    isDark,
  };
};
