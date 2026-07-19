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
}: {
  visible: boolean;
  title: string;
  options: T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#1E293B',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 36,
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)',
          }}
        >
          {/* Tutaç */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: 'rgba(71, 85, 105, 0.5)',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              color: '#F1F5F9',
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
                borderTopColor: 'rgba(71, 85, 105, 0.2)',
              }}
            >
              <Text
                style={{
                  color: opt === selected ? '#FF6B35' : '#F1F5F9',
                  fontSize: 15,
                  fontWeight: opt === selected ? '700' : '500',
                }}
              >
                {labels[opt]}
              </Text>
              {opt === selected && <Ionicons name="checkmark" size={18} color="#FF6B35" />}
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
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
        <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }} numberOfLines={1}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#1E293B', true: 'rgba(255, 107, 53, 0.4)' }}
        thumbColor={value ? '#FF6B35' : '#475569'}
        ios_backgroundColor="#334155"
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  onPress: () => void;
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
        <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#475569" />
    </TouchableOpacity>
  );
}

// ─────────────── Divider ───────────────
const Divider = () => (
  <View style={{ height: 1, backgroundColor: 'rgba(71, 85, 105, 0.2)', marginLeft: 74 }} />
);

// ───────────────── Section Kart ─────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: '#475569',
          fontSize: 11,
          fontWeight: '700',
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
          backgroundColor: '#1E293B',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(71, 85, 105, 0.3)',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {/* ── Görünüm ── */}
        <SectionCard title="Görünüm">
          <DropdownRow
              icon="contrast-outline"
              iconBg="rgba(99, 102, 241, 0.15)"
              iconColor="#818CF8"
              label="Tema"
              value={THEME_LABELS[mode]}
              onPress={() => setThemeModalVisible(true)}
            />
        </SectionCard>

        {/* ── Bildirim & Ses ── */}
        <SectionCard title="Bildirim & Ses">
          <ToggleRow
            icon="notifications-outline"
            iconBg="rgba(16, 185, 129, 0.15)"
            iconColor="#10B981"
            label="Bildirimler"
            description="Günlük hatırlatmalar ve öneriler"
            value={notifications}
            onChange={setNotifications}
          />
          <Divider />
          <ToggleRow
            icon="volume-medium-outline"
            iconBg="rgba(96, 165, 250, 0.15)"
            iconColor="#60A5FA"
            label="Ses Efektleri"
            description="Uygulama içi ses efektleri"
            value={sound}
            onChange={setSound}
          />
          <Divider />
          <ToggleRow
            icon="phone-portrait-outline"
            iconBg="rgba(168, 85, 247, 0.15)"
            iconColor="#A855F7"
            label="Titreşim"
            description="Dokunuş geri bildirimi"
            value={vibration}
            onChange={setVibration}
          />
        </SectionCard>

        {/* ── Dil & Bölge ── */}
        <SectionCard title="Dil & Bölge">
          <DropdownRow
            icon="language-outline"
            iconBg="rgba(245, 158, 11, 0.15)"
            iconColor="#F59E0B"
            label="Dil"
            value={LANGUAGE_LABELS[language]}
            onPress={() => setLanguageModalVisible(true)}
          />
          <Divider />
          <DropdownRow
            icon="scale-outline"
            iconBg="rgba(239, 68, 68, 0.15)"
            iconColor="#EF4444"
            label="Ölçü Birimi"
            value={UNIT_LABELS[unit]}
            onPress={() => setUnitModalVisible(true)}
          />
        </SectionCard>

        {/* ── Not ── */}
        <View style={{ marginTop: 8 }}>
          <View
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              borderWidth: 1,
              borderColor: 'rgba(99, 102, 241, 0.2)',
            }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#818CF8" style={{ marginTop: 1 }} />
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 18 }}>
              Tema, dil ve ölçü birimi değişiklikleri uygulamanın sonraki sürümünde tam olarak devreye girecektir.
            </Text>
          </View>
        </View>
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
      />
      <DropdownModal
        visible={languageModalVisible}
        title="Dil Seçin"
        options={['tr', 'en'] as LanguageOption[]}
        labels={LANGUAGE_LABELS}
        selected={language}
        onSelect={setLanguage}
        onClose={() => setLanguageModalVisible(false)}
      />
      <DropdownModal
        visible={unitModalVisible}
        title="Ölçü Birimi Seçin"
        options={['metric', 'imperial'] as UnitOption[]}
        labels={UNIT_LABELS}
        selected={unit}
        onSelect={setUnit}
        onClose={() => setUnitModalVisible(false)}
      />
    </SafeAreaView>
  );
}
