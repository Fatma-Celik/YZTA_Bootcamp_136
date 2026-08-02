import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient, BIRIM_LABELS, BirimOption } from '@/utils/ingredientUtils';
import { useTheme } from '@/contexts/ThemeContext';

export interface IngredientWithMeta extends Ingredient {
  kategori?: string;
  tahmini_fiyat?: string;
  kaynak?: string;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  et_protein: { label: 'Et & Protein', bg: 'rgba(239, 68, 68, 0.12)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
  sebze_meyve: { label: 'Sebze & Meyve', bg: 'rgba(34, 197, 94, 0.12)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  tahil_bakliyat: { label: 'Tahıl & Bakliyat', bg: 'rgba(234, 179, 8, 0.12)', text: '#FACC15', border: 'rgba(234, 179, 8, 0.3)' },
  sut_urunleri: { label: 'Süt Ürünleri', bg: 'rgba(59, 130, 246, 0.12)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  atistirmalik: { label: 'Atıştırmalık', bg: 'rgba(168, 85, 247, 0.12)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' },
  icecek: { label: 'İçecek', bg: 'rgba(20, 184, 166, 0.12)', text: '#2DD4BF', border: 'rgba(20, 184, 166, 0.3)' },
};

function getCategoryBadge(cat?: string) {
  if (!cat) return { label: 'Genel', bg: 'rgba(255, 107, 53, 0.12)', text: '#FF6B35', border: 'rgba(255, 107, 53, 0.3)' };
  const key = cat.toLowerCase().trim();
  return (
    CATEGORY_MAP[key] || {
      label: cat.replace('_', ' ').toUpperCase(),
      bg: 'rgba(255, 107, 53, 0.12)',
      text: '#FF6B35',
      border: 'rgba(255, 107, 53, 0.3)',
    }
  );
}

// ─────────── Malzeme Düzenleme Kartı ───────────
export default function IngredientEditCard({
  ingredient,
  onMiktarChange,
  onBirimPress,
  onDelete,
  kaynak,
}: {
  ingredient: IngredientWithMeta;
  onMiktarChange: (id: string, value: string) => void;
  onBirimPress: (id: string) => void;
  onDelete: (id: string) => void;
  kaynak?: string;
}) {
  const { colors } = useTheme();
  const miktarValue = parseFloat(ingredient.miktar);
  const hasError =
    ingredient.miktar.trim() === '' ||
    isNaN(miktarValue) ||
    miktarValue <= 0;

  const isGemini = kaynak === 'gemini' || ingredient.kaynak === 'gemini';
  const catBadge = getCategoryBadge(ingredient.kategori);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: hasError ? 'rgba(239, 68, 68, 0.5)' : colors.cardBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Ürün Fotoğraf Alanı — kaynak gemini ise resim beklemeyiz, gizleriz */}
        {!isGemini && (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 107, 53, 0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              flexShrink: 0,
            }}
          >
            <Ionicons name="leaf" size={22} color={colors.primary} />
          </View>
        )}

        {/* İçerik */}
        <View style={{ flex: 1 }}>
          {/* Rozetler (Kategori & Fiyat) */}
          {(ingredient.kategori || ingredient.tahmini_fiyat) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              {ingredient.kategori && (
                <View
                  style={{
                    backgroundColor: catBadge.bg,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: catBadge.border,
                  }}
                >
                  <Text style={{ color: catBadge.text, fontSize: 10, fontWeight: '700' }}>
                    {catBadge.label}
                  </Text>
                </View>
              )}
              {ingredient.tahmini_fiyat && (
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Ionicons name="pricetag-outline" size={10} color="#10B981" />
                  <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>
                    {ingredient.tahmini_fiyat}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Malzeme Adı + Sil Butonu */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text
              style={{
                color: colors.textPrimary,
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
                backgroundColor: colors.inputBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: hasError
                  ? 'rgba(239, 68, 68, 0.5)'
                  : colors.cardBorder,
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
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: '600',
                  textAlign: 'center',
                  padding: 0,
                  minHeight: 24,
                }}
                placeholderTextColor={colors.textMuted}
                placeholder="0"
              />
            </View>

            {/* Birim Dropdown Trigger */}
            <TouchableOpacity
              onPress={() => onBirimPress(ingredient.id)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: colors.inputBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {BIRIM_LABELS[ingredient.birim as BirimOption] || ingredient.birim}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
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
