import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface RecentMealCardProps {
  meal: {
    idMeal?: string;
    strMeal: string;
    strCategory: string;
    strArea: string;
    strMealThumb: string;
  } | null;
  onPress?: () => void;
}

export default function RecentMealCard({ meal, onPress }: RecentMealCardProps) {
  const { colors } = useTheme();

  // Eğer API'den veri henüz gelmediyse iskelet (skeleton) bir görünüm sunalım
  if (!meal) {
    return (
      <View
        style={{
          width: '95%',
          alignSelf: 'center',
          padding: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderRadius: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 12, width: 64, backgroundColor: colors.divider, borderRadius: 6 }} />
          <View style={{ height: 20, width: 160, backgroundColor: colors.divider, borderRadius: 6 }} />
          <View style={{ height: 12, width: 96, backgroundColor: colors.divider, borderRadius: 6 }} />
        </View>
        <View style={{ width: 80, height: 80, backgroundColor: colors.divider, borderRadius: 12 }} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={{
        width: '95%',
        alignSelf: 'center',
        padding: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: colors.cardBorder,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Sol Taraf: Tarif Bilgileri (Kategori, İsim, Ülke) */}
      <View style={{ flex: 1, paddingRight: 16 }}>
        {/* Kategori Etiketi */}
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
          {meal.strCategory}
        </Text>

        {/* Yemek Adı */}
        <Text
          numberOfLines={2}
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: colors.textPrimary,
            letterSpacing: -0.3,
            marginTop: 4,
            textAlign: 'left',
            lineHeight: 22,
          }}
        >
          {meal.strMeal}
        </Text>

        {/* Ülke/Mutfak Bilgisi */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2, textAlign: 'left' }}>
            🌍 {meal.strArea} Mutfağı
          </Text>
        </View>
      </View>

      {/* Sağ Taraf: Görsel Alanı */}
      <View
        style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.divider }}
      >
        <Image
          source={{ uri: `${meal.strMealThumb}/preview` }}
          style={{ width: 80, height: 80 }}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
}