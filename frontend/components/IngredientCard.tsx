import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export interface IngredientItem {
  idIngredient: string;
  strIngredient: string;
  strDescription?: string | null;
  strType?: string | null;
}

interface IngredientCardProps {
  ingredient: IngredientItem;
  isSelected: boolean;
  onToggle: (ingredient: IngredientItem) => void;
  width?: number;
}

export default function IngredientCard({
  ingredient,
  isSelected,
  onToggle,
  width,
}: IngredientCardProps) {
  const { colors } = useTheme();
  const imageUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(
    ingredient.strIngredient
  )}-Small.png`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onToggle(ingredient)}
      style={{
        width: width || '31%',
        marginBottom: 10,
        backgroundColor: isSelected ? 'rgba(255, 107, 53, 0.12)' : colors.card,
        borderRadius: 14,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isSelected ? colors.primary : colors.cardBorder,
        position: 'relative',
      }}
    >
      {/* Sol Üst Köşe İkonu */}
      <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
        ) : (
          <Ionicons name="ellipse-outline" size={18} color={colors.iconDefault} />
        )}
      </View>

      {/* Resim */}
      <View style={{ width: 48, height: 48, marginTop: 4, marginBottom: 6 }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>

      {/* İsim */}
      <Text
        numberOfLines={2}
        style={{
          color: isSelected ? colors.primary : colors.textPrimary,
          fontSize: 11,
          fontWeight: isSelected ? '700' : '600',
          textAlign: 'center',
          lineHeight: 14,
        }}
      >
        {ingredient.strIngredient}
      </Text>
    </TouchableOpacity>
  );
}
