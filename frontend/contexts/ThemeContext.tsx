import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useAuth } from './AuthContext';
import { useProfile } from '@/hooks/useProfile';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  inputBg: string;
  primary: string;
  statusBar: 'light-content' | 'dark-content';
}

const darkColors: ThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  cardBorder: 'rgba(71, 85, 105, 0.3)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  divider: 'rgba(71, 85, 105, 0.2)',
  inputBg: 'rgba(15, 23, 42, 0.6)',
  primary: '#FF6B35',
  statusBar: 'light-content',
};

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: 'rgba(203, 213, 225, 0.6)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  divider: 'rgba(203, 213, 225, 0.5)',
  inputBg: '#F1F5F9',
  primary: '#FF6B35',
  statusBar: 'dark-content',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [localMode, setLocalMode] = useState<ThemeMode>('system');

  // Profil yüklenince kayıtlı tercihi uygula
  useEffect(() => {
    if (profile?.theme) setLocalMode(profile.theme as ThemeMode);
  }, [profile?.theme]);

  const isDark = localMode === 'system' ? systemScheme === 'dark' : localMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setMode = (m: ThemeMode) => {
    setLocalMode(m);
    if (user) updateProfile({ theme: m }); // Supabase'e kaydet, kalıcı olsun
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