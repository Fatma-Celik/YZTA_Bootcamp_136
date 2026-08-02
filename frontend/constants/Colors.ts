import { StatusBarStyle } from 'react-native';

// ─── Tema Renk Token Tipleri ───
export interface ThemeColors {
  // Arka planlar
  background: string;
  card: string;
  cardBorder: string;
  inputBg: string;
  tabBarBg: string;

  // Metin
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Bölücü / divider
  divider: string;

  // Ana marka rengi (her iki temada sabit)
  primary: string;

  // StatusBar stili
  statusBar: StatusBarStyle;

  // Overlay / modal arka planı
  overlay: string;

  // Ek semantik renkler (temada değişen)
  cardHighlight: string;
  iconDefault: string;
  searchBg: string;
  badgeBg: string;
  tagBg: string;
  tagText: string;
}

// ─── Karanlık Tema ───
export const darkColors: ThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  cardBorder: 'rgba(71, 85, 105, 0.3)',
  inputBg: 'rgba(15, 23, 42, 0.6)',
  tabBarBg: '#0F172A',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  divider: 'rgba(71, 85, 105, 0.2)',

  primary: '#FF6B35',

  statusBar: 'light-content',

  overlay: 'rgba(0, 0, 0, 0.6)',

  cardHighlight: 'rgba(30, 41, 59, 0.7)',
  iconDefault: '#64748B',
  searchBg: 'rgba(30, 41, 59, 0.9)',
  badgeBg: '#334155',
  tagBg: 'rgba(51, 65, 85, 0.8)',
  tagText: '#CBD5E1',
};

// ─── Açık Tema ───
export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#0F172A',
  inputBg: 'rgba(255, 107, 53, 0.08)',
  tabBarBg: '#FFFFFF',

  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',

  divider: 'rgba(15, 23, 42, 0.15)',

  primary: '#FF6B35',

  statusBar: 'dark-content',

  overlay: 'rgba(0, 0, 0, 0.4)',

  cardHighlight: '#F1F5F9',
  iconDefault: '#0F172A',
  searchBg: 'rgba(255, 107, 53, 0.08)',
  badgeBg: '#E2E8F0',
  tagBg: 'rgba(255, 107, 53, 0.12)',
  tagText: '#D97706',
};

// ─── Default export (uyumluluk için) ───
export default {
  light: {
    text: lightColors.textPrimary,
    background: lightColors.background,
    tint: lightColors.primary,
    tabIconDefault: lightColors.textMuted,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    text: darkColors.textPrimary,
    background: darkColors.background,
    tint: darkColors.primary,
    tabIconDefault: darkColors.textMuted,
    tabIconSelected: darkColors.primary,
  },
};
