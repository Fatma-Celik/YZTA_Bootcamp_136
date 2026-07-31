import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient, BIRIM_LABELS, BirimOption } from '@/utils/ingredientUtils';

// ─────────── Malzeme Düzenleme Kartı ───────────
export default function IngredientEditCard({
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
