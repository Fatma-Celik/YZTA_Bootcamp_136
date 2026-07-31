import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        backgroundColor: isSelected ? 'rgba(255, 107, 53, 0.12)' : 'rgba(30, 41, 59, 0.7)',
        borderRadius: 14,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isSelected ? '#FF6B35' : 'rgba(71, 85, 105, 0.3)',
        position: 'relative',
      }}
    >
      {/* Sol Üst Köşe İkonu */}
      <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={18} color="#FF6B35" />
        ) : (
          <Ionicons name="ellipse-outline" size={18} color="#64748B" />
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
          color: isSelected ? '#FF6B35' : '#F1F5F9',
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
