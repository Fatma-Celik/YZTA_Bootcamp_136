import React from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 sütun, kenar + ara boşluk

export interface RecipeMeal {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strMealThumb: string;
  strIngredient1?: string | null;
  strIngredient2?: string | null;
  strIngredient3?: string | null;
  strIngredient4?: string | null;
  strIngredient5?: string | null;
  [key: string]: any;
}

interface RecipeCardProps {
  meal: RecipeMeal | null;
  onPress?: (meal: RecipeMeal) => void;
}

// Kategori renklerini belirleyen yardımcı fonksiyon
const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    Beef: '#DC2626',
    Breakfast: '#F59E0B',
    Chicken: '#F97316',
    Dessert: '#EC4899',
    Goat: '#8B5CF6',
    Lamb: '#10B981',
    Miscellaneous: '#6B7280',
    Pasta: '#EAB308',
    Pork: '#E11D48',
    Seafood: '#0EA5E9',
    Side: '#14B8A6',
    Starter: '#8B5CF6',
    Vegan: '#22C55E',
    Vegetarian: '#84CC16',
  };
  return colors[category || ''] || '#FF6B35';
};

// Meal objesinden ilk 3 geçerli (boş olmayan) ingredient'ı çıkar
function getTopIngredients(meal: RecipeMeal): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    if (ing && typeof ing === 'string' && ing.trim() !== '') {
      ingredients.push(ing.trim());
      if (ingredients.length >= 3) break;
    }
  }
  return ingredients;
}

export default function RecipeCard({ meal, onPress }: RecipeCardProps) {
  const { colors } = useTheme();

  // Skeleton loading durumu
  if (!meal) {
    return (
      <View
        style={{
          width: CARD_WIDTH,
          marginBottom: 16,
          backgroundColor: colors.card,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        {/* Resim Skeleton */}
        <View
          style={{ width: CARD_WIDTH, height: CARD_WIDTH * 0.85, backgroundColor: colors.divider }}
        />
        {/* Bilgi Skeleton */}
        <View style={{ padding: 12, gap: 8 }}>
          <View style={{ height: 16, width: '75%', backgroundColor: colors.divider, borderRadius: 8 }} />
          <View style={{ height: 12, width: '50%', backgroundColor: colors.divider, borderRadius: 6 }} />
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
            <View style={{ height: 20, width: 56, backgroundColor: colors.divider, borderRadius: 6 }} />
            <View style={{ height: 20, width: 48, backgroundColor: colors.divider, borderRadius: 6 }} />
          </View>
        </View>
      </View>
    );
  }

  const categoryColor = getCategoryColor(meal.strCategory);
  const ingredients = getTopIngredients(meal);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress && onPress(meal)}
      style={{
        width: CARD_WIDTH,
        marginBottom: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        shadowColor: colors.cardBorder,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Üst Kısım: Yemek Görseli */}
      <View style={{ width: CARD_WIDTH, height: CARD_WIDTH * 0.85, position: 'relative' }}>
        <Image
          source={{ uri: `${meal.strMealThumb}/preview` }}
          style={{ width: CARD_WIDTH, height: CARD_WIDTH * 0.85 }}
          resizeMode="cover"
        />

        {/* Kategori Badge - Sol Üst Köşe */}
        {meal.strCategory ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: categoryColor,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 4,
            }}
          >
            <Text
              style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}
            >
              {meal.strCategory.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Alt Kısım: Yemek Bilgileri */}
      <View style={{ padding: 12 }}>
        {/* Yemek Adı */}
        <Text
          numberOfLines={2}
          style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary, lineHeight: 18, letterSpacing: -0.2 }}
        >
          {meal.strMeal}
        </Text>

        {/* Ülke/Alan Bilgisi */}
        {meal.strArea ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
              🌍 {meal.strArea}
            </Text>
          </View>
        ) : null}

        {/* İlk 3 Ingredient Pill'leri */}
        {ingredients.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 }}>
            {ingredients.map((ing, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 107, 53, 0.15)',
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 107, 53, 0.25)',
                }}
              >
                <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '700' }}>
                  {ing}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
