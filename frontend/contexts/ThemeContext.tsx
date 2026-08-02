import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '@/constants/Colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [localMode, setLocalMode] = useState<ThemeMode>('dark');

  // Uygulama açılışında AsyncStorage'dan kaydedilmiş temayı yükle
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && (stored === 'system' || stored === 'light' || stored === 'dark')) {
          setLocalMode(stored);
        }
      } catch (e) {
        // Hata durumunda varsayılan dark tema ile devam et
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = localMode === 'system' ? systemScheme !== 'light' : localMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setMode = (m: ThemeMode) => {
    setLocalMode(m);
    AsyncStorage.setItem(THEME_STORAGE_KEY, m).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ mode: localMode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}