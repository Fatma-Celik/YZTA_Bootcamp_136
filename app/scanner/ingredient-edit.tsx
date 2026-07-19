import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';

// ─────────── Tipler ───────────
interface Ingredient {
  id: string;
  ad: string;
  miktar: string;
  birim: string;
}

// ─────────── Birim Seçenekleri ───────────
const BIRIM_OPTIONS = [
  'adet',
  'gram (g)',
  'kilogram (kg)',
  'mililitre (ml)',
  'litre (lt)',
  'kap',
  'çay kaşığı',
  'yemek kaşığı',
  'demet',
  'dilim',
  'paket',
  'kavanoz',
  'şişe',
  'tutam',
] as const;

type BirimOption = (typeof BIRIM_OPTIONS)[number];

const BIRIM_LABELS: Record<BirimOption, string> = {
  'adet': 'Adet',
  'gram (g)': 'Gram (g)',
  'kilogram (kg)': 'Kilogram (kg)',
  'mililitre (ml)': 'Mililitre (ml)',
  'litre (lt)': 'Litre (lt)',
  'kap': 'Kap',
  'çay kaşığı': 'Çay Kaşığı',
  'yemek kaşığı': 'Yemek Kaşığı',
  'demet': 'Demet',
  'dilim': 'Dilim',
  'paket': 'Paket',
  'kavanoz': 'Kavanoz',
  'şişe': 'Şişe',
  'tutam': 'Tutam',
};

// ─────────── Miktar Parsing ───────────
function parseMiktar(miktarStr: string): { miktar: string; birim: BirimOption } {
  const str = miktarStr.toLowerCase().trim();

  // Match number at the beginning (e.g., "500", "1", "0.5", "250-300")
  const numMatch = str.match(/^[\d.,\-–]+/);
  const miktarNum = numMatch ? numMatch[0].replace(',', '.') : '1';

  // Remaining string after the number
  const remaining = str.slice(numMatch ? numMatch[0].length : 0).trim();

  // Try to match known units
  if (/litre|lt/i.test(remaining)) return { miktar: miktarNum, birim: 'litre (lt)' };
  if (/kilogram|kg/i.test(remaining)) return { miktar: miktarNum, birim: 'kilogram (kg)' };
  if (/gram|gr?\b/i.test(remaining)) return { miktar: miktarNum, birim: 'gram (g)' };
  if (/mililitre|ml/i.test(remaining)) return { miktar: miktarNum, birim: 'mililitre (ml)' };
  if (/kap/i.test(remaining)) return { miktar: miktarNum, birim: 'kap' };
  if (/kavanoz/i.test(remaining)) return { miktar: miktarNum, birim: 'kavanoz' };
  if (/şişe/i.test(remaining)) return { miktar: miktarNum, birim: 'şişe' };
  if (/paket/i.test(remaining)) return { miktar: miktarNum, birim: 'paket' };
  if (/demet/i.test(remaining)) return { miktar: miktarNum, birim: 'demet' };
  if (/dilim/i.test(remaining)) return { miktar: miktarNum, birim: 'dilim' };
  if (/tutam/i.test(remaining)) return { miktar: miktarNum, birim: 'tutam' };
  if (/çay\s*kaşığı|çkş/i.test(remaining)) return { miktar: miktarNum, birim: 'çay kaşığı' };
  if (/yemek\s*kaşığı|ykş/i.test(remaining)) return { miktar: miktarNum, birim: 'yemek kaşığı' };
  if (/adet/i.test(remaining)) return { miktar: miktarNum, birim: 'adet' };

  return { miktar: miktarNum, birim: 'adet' };
}

// ─────────── Birim Dropdown Modal ───────────
function BirimDropdownModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: BirimOption;
  onSelect: (v: BirimOption) => void;
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
            maxHeight: '60%',
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
            Birim Seçin
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {BIRIM_OPTIONS.map((opt, idx) => (
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
                  {BIRIM_LABELS[opt]}
                </Text>
                {opt === selected && (
                  <Ionicons name="checkmark" size={18} color="#FF6B35" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────── Malzeme Kartı ───────────
function IngredientEditCard({
  ingredient,
  onMiktarChange,
  onBirimPress,
  onDelete,
}: {
  ingredient: Ingredient;
  onMiktarChange: (id: string, value: string) => void;
  onBirimPress: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const miktarValue = parseFloat(ingredient.miktar);
  const hasError =
    ingredient.miktar.trim() === '' ||
    isNaN(miktarValue) ||
    miktarValue <= 0;

  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: hasError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(71, 85, 105, 0.3)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Ürün Fotoğraf Alanı (Placeholder Icon) */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          <Ionicons name="leaf" size={22} color="#FF6B35" />
        </View>

        {/* İçerik */}
        <View style={{ flex: 1 }}>
          {/* Malzeme Adı + Sil Butonu */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 15,
                fontWeight: '700',
                textTransform: 'capitalize',
                flex: 1,
              }}
              numberOfLines={1}
            >
              {ingredient.ad}
            </Text>

            {/* Sil Butonu */}
            <TouchableOpacity
              onPress={() => onDelete(ingredient.id)}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
              }}
            >
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Miktar + Birim */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Miktar Input */}
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
                minWidth: 70,
              }}
            >
              <TextInput
                value={ingredient.miktar}
                onChangeText={(text) => onMiktarChange(ingredient.id, text)}
                keyboardType="numeric"
                style={{
                  color: '#F1F5F9',
                  fontSize: 14,
                  fontWeight: '600',
                  textAlign: 'center',
                  padding: 0,
                  minHeight: 24,
                }}
                placeholderTextColor="#475569"
                placeholder="0"
              />
            </View>

            {/* Birim Dropdown Trigger */}
            <TouchableOpacity
              onPress={() => onBirimPress(ingredient.id)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(71, 85, 105, 0.4)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {BIRIM_LABELS[ingredient.birim as BirimOption] || ingredient.birim}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Hata Mesajı */}
      {hasError && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            marginLeft: 60,
            gap: 4,
          }}
        >
          <Ionicons name="warning" size={13} color="#EF4444" />
          <Text
            style={{
              color: '#EF4444',
              fontSize: 11,
              fontWeight: '600',
            }}
          >
            Miktar 0'dan büyük bir değer olmalıdır
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────── Ana Ekran ───────────
export default function IngredientEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ingredients: string }>();

  // Parse ingredients from route params
  const initialIngredients = useMemo(() => {
    try {
      const rawList = JSON.parse(params.ingredients || '[]') as Array<{
        ad: string;
        miktar: string;
      }>;
      return rawList.map((item, index) => {
        const parsed = parseMiktar(item.miktar);
        return {
          id: `ing_${index}`,
          ad: item.ad,
          miktar: parsed.miktar,
          birim: parsed.birim,
        } as Ingredient;
      });
    } catch {
      return [] as Ingredient[];
    }
  }, [params.ingredients]);

  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [dropdownIngredientId, setDropdownIngredientId] = useState<string | null>(null);

  // Find selected ingredient for dropdown
  const selectedIngredient = ingredients.find(
    (i) => i.id === dropdownIngredientId
  );

  // ── Handlers ──
  const handleMiktarChange = (id: string, value: string) => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, miktar: value } : item
      )
    );
  };

  const handleBirimChange = (birim: BirimOption) => {
    if (!dropdownIngredientId) return;
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === dropdownIngredientId ? { ...item, birim } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCancel = () => {
    router.back();
  };

  const { setIngredients: setContextIngredients } = useRecipeFlow();

  const handleConfirm = () => {
    // Malzemeleri context'e kaydet ve tarif detay ekranına yönlendir
    setContextIngredients(ingredients);
    router.push('/scanner/recipe-details');
  };

  // Check if any ingredient has validation errors
  const hasAnyError = ingredients.some((item) => {
    const val = parseFloat(item.miktar);
    return item.miktar.trim() === '' || isNaN(val) || val <= 0;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* ── Header Info ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          {/* Info Badge */}
          <View
            style={{
              backgroundColor: 'rgba(255, 107, 53, 0.08)',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 53, 0.2)',
            }}
          >
            <Ionicons name="sparkles" size={18} color="#FF6B35" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#F1F5F9',
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                AI Analiz Sonucu
              </Text>
              <Text
                style={{
                  color: '#94A3B8',
                  fontSize: 12,
                  fontWeight: '500',
                  marginTop: 2,
                }}
              >
                {ingredients.length} malzeme tespit edildi — miktarları düzenleyebilirsiniz
              </Text>
            </View>
          </View>
        </View>

        {/* ── Ingredient List ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {ingredients.map((item) => (
            <IngredientEditCard
              key={item.id}
              ingredient={item}
              onMiktarChange={handleMiktarChange}
              onBirimPress={(id) => setDropdownIngredientId(id)}
              onDelete={handleDelete}
            />
          ))}

          {ingredients.length === 0 && (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 60,
              }}
            >
              <Ionicons name="alert-circle-outline" size={48} color="#475569" />
              <Text
                style={{
                  color: '#64748B',
                  fontSize: 16,
                  fontWeight: '600',
                  marginTop: 12,
                }}
              >
                Malzeme bulunamadı
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Bottom Buttons ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: 'rgba(71, 85, 105, 0.2)',
            backgroundColor: '#0F172A',
            gap: 10,
          }}
        >
          {/* Onayla ve Devam Et */}
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.8}
            style={{
              backgroundColor: hasAnyError
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
              shadowOpacity: hasAnyError ? 0 : 0.25,
              shadowRadius: 12,
              elevation: hasAnyError ? 0 : 6,
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={hasAnyError ? 'rgba(255,255,255,0.5)' : '#fff'}
            />
            <Text
              style={{
                color: hasAnyError ? 'rgba(255,255,255,0.5)' : '#fff',
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              Onayla ve Devam Et
            </Text>
          </TouchableOpacity>

          {/* İptal Et */}
          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(71, 85, 105, 0.3)',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              İptal Et
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Birim Dropdown Modal ── */}
      <BirimDropdownModal
        visible={!!dropdownIngredientId}
        selected={
          (selectedIngredient?.birim as BirimOption) || 'adet'
        }
        onSelect={handleBirimChange}
        onClose={() => setDropdownIngredientId(null)}
      />
    </SafeAreaView>
  );
}
