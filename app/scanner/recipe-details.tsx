import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';
import { BASE_URL, ENDPOINTS } from '@/constants/ApiConfig';

// ─────────── Dropdown Seçenekleri ───────────
const DIYET_OPTIONS = ['normal'] as const;
const HEDEF_OPTIONS = ['normal'] as const;

type DiyetOption = (typeof DIYET_OPTIONS)[number];
type HedefOption = (typeof HEDEF_OPTIONS)[number];

const DIYET_LABELS: Record<DiyetOption, string> = {
  normal: 'Normal',
};

const HEDEF_LABELS: Record<HedefOption, string> = {
  normal: 'Normal',
};

// ─────────── Genel Dropdown Modal ───────────
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
  options: readonly T[];
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
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        }}
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
          {/* Handle */}
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
              onPress={() => {
                onSelect(opt);
                onClose();
              }}
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
              {opt === selected && (
                <Ionicons name="checkmark" size={18} color="#FF6B35" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────── Collapsible Malzeme Listesi ───────────
function IngredientCollapsible({
  ingredients,
}: {
  ingredients: Array<{ ad: string; miktar: string; birim: string }>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.3)',
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="basket" size={20} color="#FF6B35" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
            Malzemeler
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
            {ingredients.length} ürün seçildi
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#64748B"
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: 'rgba(71, 85, 105, 0.2)',
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          {ingredients.map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: idx < ingredients.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(71, 85, 105, 0.15)',
              }}
            >
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 14,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.ad}
              </Text>
              <Text
                style={{
                  color: '#94A3B8',
                  fontSize: 13,
                  fontWeight: '500',
                  marginLeft: 8,
                }}
              >
                {item.miktar} {item.birim}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────── Ayar Satırı: Sayısal Input ───────────
function NumberInputRow({
  icon,
  iconColor,
  label,
  description,
  value,
  onChange,
  suffix,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  const numVal = parseFloat(value);
  const hasError = value.trim() === '' || isNaN(numVal) || numVal <= 0;

  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: hasError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(71, 85, 105, 0.3)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${iconColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
            {label}
          </Text>
          <Text
            style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }}
          >
            {description}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: hasError
                ? 'rgba(239, 68, 68, 0.5)'
                : 'rgba(71, 85, 105, 0.4)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              minWidth: 60,
            }}
          >
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              style={{
                color: '#F1F5F9',
                fontSize: 15,
                fontWeight: '700',
                textAlign: 'center',
                padding: 0,
                minHeight: 26,
              }}
              placeholderTextColor="#475569"
              placeholder="0"
            />
          </View>
          {suffix && (
            <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>
              {suffix}
            </Text>
          )}
        </View>
      </View>

      {hasError && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            marginLeft: 52,
            gap: 4,
          }}
        >
          <Ionicons name="warning" size={13} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>
            Değer 0'dan büyük olmalıdır
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────── Dropdown Satırı ───────────
function DropdownRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: `${iconColor}18`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
          {label}
        </Text>
        <Text
          style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }}
        >
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={16} color="#64748B" />
    </TouchableOpacity>
  );
}

// ─────────── Ana Ekran ───────────
export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { ingredients, setRecipeResponse } = useRecipeFlow();

  // Form state
  const [kisiSayisi, setKisiSayisi] = useState('3');
  const [sureDakika, setSureDakika] = useState('30');
  const [diyet, setDiyet] = useState<DiyetOption>('normal');
  const [hedef, setHedef] = useState<HedefOption>('normal');

  // Dropdown visibility
  const [diyetModalVisible, setDiyetModalVisible] = useState(false);
  const [hedefModalVisible, setHedefModalVisible] = useState(false);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const kisiNum = parseFloat(kisiSayisi);
  const sureNum = parseFloat(sureDakika);
  const hasKisiError = kisiSayisi.trim() === '' || isNaN(kisiNum) || kisiNum <= 0;
  const hasSureError = sureDakika.trim() === '' || isNaN(sureNum) || sureNum <= 0;
  const hasAnyError = hasKisiError || hasSureError;

  const handleSubmit = async () => {
    if (hasAnyError) return;

    // Malzemeleri "ad miktar birim" formatında birleştir
    const malzemelerFormatted = ingredients.map(
      (item) => `${item.ad} ${item.miktar} ${item.birim}`
    );

    const body = {
      malzemeler: malzemelerFormatted,
      kisi_sayisi: parseInt(kisiSayisi, 10),
      sure_dakika: parseInt(sureDakika, 10),
      diyet,
      hedef,
    };

    setIsSubmitting(true);
    try {
      console.log('[RecipeDetails] Tarif önerisi isteği:', JSON.stringify(body, null, 2));
      const response = await fetch(`${BASE_URL}${ENDPOINTS.tarifOner}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('[RecipeDetails] /tarif-oner yanıtı:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('[RecipeDetails] API hatası, status:', response.status, data);
        Alert.alert('API Hatası', `Sunucu hatası: ${response.status}`);
        return;
      }

      // Yanıtı context'e kaydet ve sonuç ekranına yönlendir
      if (data.tarifler) {
        setRecipeResponse(data.tarifler);
        router.push('/scanner/recipe-results');
      } else {
        Alert.alert('Hata', 'Tarif yanıtı alınamadı.');
      }
    } catch (error) {
      console.error('[RecipeDetails] Fetch hatası:', error);
      Alert.alert(
        'Bağlantı Hatası',
        'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Malzemeler (Collapsible) ── */}
          <IngredientCollapsible ingredients={ingredients} />

          {/* ── Section Title ── */}
          <Text
            style={{
              color: '#475569',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            Tarif Tercihleri
          </Text>

          {/* ── Kişi Sayısı ── */}
          <NumberInputRow
            icon="people"
            iconColor="#818CF8"
            label="Kişi Sayısı"
            description="Kaç kişilik tarif üretilsin?"
            value={kisiSayisi}
            onChange={setKisiSayisi}
            suffix="kişi"
          />

          {/* ── Süre ── */}
          <NumberInputRow
            icon="time"
            iconColor="#10B981"
            label="Hazırlık Süresi"
            description="Maksimum hazırlık süresi"
            value={sureDakika}
            onChange={setSureDakika}
            suffix="dk"
          />

          {/* ── Diyet ── */}
          <DropdownRow
            icon="fitness"
            iconColor="#F59E0B"
            label="Diyet"
            value={DIYET_LABELS[diyet]}
            onPress={() => setDiyetModalVisible(true)}
          />

          {/* ── Hedef ── */}
          <DropdownRow
            icon="flag"
            iconColor="#EF4444"
            label="Hedef"
            value={HEDEF_LABELS[hedef]}
            onPress={() => setHedefModalVisible(true)}
          />
        </ScrollView>

        {/* ── Bottom Button ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: 'rgba(71, 85, 105, 0.2)',
            backgroundColor: '#0F172A',
          }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={hasAnyError || isSubmitting}
            style={{
              backgroundColor:
                hasAnyError || isSubmitting
                  ? 'rgba(255, 107, 53, 0.4)'
                  : '#FF6B35',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: hasAnyError || isSubmitting ? 0 : 0.25,
              shadowRadius: 12,
              elevation: hasAnyError || isSubmitting ? 0 : 6,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="sparkles"
                size={20}
                color={
                  hasAnyError ? 'rgba(255,255,255,0.5)' : '#fff'
                }
              />
            )}
            <Text
              style={{
                color:
                  hasAnyError || isSubmitting
                    ? 'rgba(255,255,255,0.5)'
                    : '#fff',
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              {isSubmitting ? 'Tarif Üretiliyor...' : 'Tarif Üret'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Dropdown Modals ── */}
      <DropdownModal
        visible={diyetModalVisible}
        title="Diyet Seçin"
        options={DIYET_OPTIONS}
        labels={DIYET_LABELS}
        selected={diyet}
        onSelect={setDiyet}
        onClose={() => setDiyetModalVisible(false)}
      />
      <DropdownModal
        visible={hedefModalVisible}
        title="Hedef Seçin"
        options={HEDEF_OPTIONS}
        labels={HEDEF_LABELS}
        selected={hedef}
        onSelect={setHedef}
        onClose={() => setHedefModalVisible(false)}
      />
    </SafeAreaView>
  );
}
