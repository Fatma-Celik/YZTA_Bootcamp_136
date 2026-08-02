import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/constants/Colors';

// ─────────────── Tipler ───────────────
type ThemeOption = 'system' | 'light' | 'dark';
type LanguageOption = 'tr' | 'en';
type UnitOption = 'metric' | 'imperial';


const THEME_LABELS: Record<ThemeOption, string> = {
  system: 'Sisteme Göre',
  light: 'Açık',
  dark: 'Koyu',
};

const LANGUAGE_LABELS: Record<LanguageOption, string> = {
  tr: 'Türkçe',
  en: 'English',
};

const UNIT_LABELS: Record<UnitOption, string> = {
  metric: 'Metrik (kg / cm)',
  imperial: 'Imperial (lb / in)',
};

// ─────────────── Dropdown Bileşeni ───────────────
function DropdownModal<T extends string>({
  visible,
  title,
  options,
  labels,
  selected,
  onSelect,
  onClose,
  colors,
}: {
  visible: boolean;
  title: string;
  options: T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (v: T) => void;
  onClose: () => void;
  colors: ThemeColors;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 36,
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          {/* Tutaç */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.iconDefault,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: '800',
              paddingHorizontal: 20,
              marginBottom: 12,
            }}
          >
            {title}
          </Text>
          {options.map((opt, idx) => (
            <TouchableOpacity
              key={opt}
              onPress={() => { onSelect(opt); onClose(); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: colors.divider,
              }}
            >
              <Text
                style={{
                  color: opt === selected ? colors.primary : colors.textPrimary,
                  fontSize: 15,
                  fontWeight: opt === selected ? '700' : '500',
                }}
              >
                {labels[opt]}
              </Text>
              {opt === selected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────── Ayar Satırı: Toggle ───────────────
function ToggleRow({
  icon,
  iconBg,
  iconColor,
  label,
  description,
  value,
  onChange,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 1 }} numberOfLines={1}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.card, true: 'rgba(255, 107, 53, 0.4)' }}
        thumbColor={value ? colors.primary : colors.iconDefault}
        ios_backgroundColor={colors.badgeBg}
      />
    </View>
  );
}

// ─────────────── Ayar Satırı: Dropdown ───────────────
function DropdownRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 1 }}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.iconDefault} />
    </TouchableOpacity>
  );
}

// ─────────────── Divider ───────────────
function ThemeDivider({ colors }: { colors: ThemeColors }) {
  return <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 74 }} />;
}

// ───────────────── Section Kart ─────────────────
function SectionCard({ title, children, colors }: { title: string; children: React.ReactNode; colors: ThemeColors }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 6,
          marginLeft: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ─────────────── Ana Ekran ───────────────
export default function PreferencesScreen() {
  // Tema
  const { mode, setMode, colors } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Toggle'lar
  const [vibration, setVibration] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(false);

  // Dil
  const [language, setLanguage] = useState<LanguageOption>('tr');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Ölçü Birimi
  const [unit, setUnit] = useState<UnitOption>('metric');
  const [unitModalVisible, setUnitModalVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <StatusBar barStyle={colors.statusBar} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {/* ── Görünüm ── */}
        <SectionCard title="Görünüm" colors={colors}>
          <DropdownRow
              icon="contrast-outline"
              iconBg="rgba(99, 102, 241, 0.15)"
              iconColor="#818CF8"
              label="Tema"
              value={THEME_LABELS[mode]}
              onPress={() => setThemeModalVisible(true)}
              colors={colors}
            />
        </SectionCard>

        {/* ── Bildirim & Ses ── */}
        <SectionCard title="Bildirim & Ses" colors={colors}>
          <ToggleRow
            icon="notifications-outline"
            iconBg="rgba(16, 185, 129, 0.15)"
            iconColor="#10B981"
            label="Bildirimler"
            description="Günlük hatırlatmalar ve öneriler"
            value={notifications}
            onChange={setNotifications}
            colors={colors}
          />
          <ThemeDivider colors={colors} />
          <ToggleRow
            icon="volume-medium-outline"
            iconBg="rgba(96, 165, 250, 0.15)"
            iconColor="#60A5FA"
            label="Ses Efektleri"
            description="Uygulama içi ses efektleri"
            value={sound}
            onChange={setSound}
            colors={colors}
          />
          <ThemeDivider colors={colors} />
          <ToggleRow
            icon="phone-portrait-outline"
            iconBg="rgba(168, 85, 247, 0.15)"
            iconColor="#A855F7"
            label="Titreşim"
            description="Dokunuş geri bildirimi"
            value={vibration}
            onChange={setVibration}
            colors={colors}
          />
        </SectionCard>

        {/* ── Dil & Bölge ── */}
        <SectionCard title="Dil & Bölge" colors={colors}>
          <DropdownRow
            icon="language-outline"
            iconBg="rgba(245, 158, 11, 0.15)"
            iconColor="#F59E0B"
            label="Dil"
            value={LANGUAGE_LABELS[language]}
            onPress={() => setLanguageModalVisible(true)}
            colors={colors}
          />
          <ThemeDivider colors={colors} />
          <DropdownRow
            icon="scale-outline"
            iconBg="rgba(239, 68, 68, 0.15)"
            iconColor="#EF4444"
            label="Ölçü Birimi"
            value={UNIT_LABELS[unit]}
            onPress={() => setUnitModalVisible(true)}
            colors={colors}
          />
        </SectionCard>
      </ScrollView>

      {/* Dropdownlar */}
      <DropdownModal
        visible={themeModalVisible}
        title="Tema Seçin"
        options={['system', 'light', 'dark'] as ThemeMode[]}
        labels={THEME_LABELS}
        selected={mode}
        onSelect={setMode}
        onClose={() => setThemeModalVisible(false)}
        colors={colors}
      />
      <DropdownModal
        visible={languageModalVisible}
        title="Dil Seçin"
        options={['tr', 'en'] as LanguageOption[]}
        labels={LANGUAGE_LABELS}
        selected={language}
        onSelect={setLanguage}
        onClose={() => setLanguageModalVisible(false)}
        colors={colors}
      />
      <DropdownModal
        visible={unitModalVisible}
        title="Ölçü Birimi Seçin"
        options={['metric', 'imperial'] as UnitOption[]}
        labels={UNIT_LABELS}
        selected={unit}
        onSelect={setUnit}
        onClose={() => setUnitModalVisible(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
}
