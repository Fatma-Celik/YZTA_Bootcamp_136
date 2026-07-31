import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';

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

export default function RecipeCard({ meal }: RecipeCardProps) {
  // Skeleton loading durumu
  if (!meal) {
    return (
      <View
        style={{ width: CARD_WIDTH, marginBottom: 16 }}
        className="bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-700/50"
      >
        {/* Resim Skeleton */}
        <View
          style={{ width: CARD_WIDTH, height: CARD_WIDTH * 0.85 }}
          className="bg-slate-700/50"
        />
        {/* Bilgi Skeleton */}
        <View className="p-3 space-y-2">
          <View className="h-4 w-3/4 bg-slate-700/50 rounded-full" />
          <View className="h-3 w-1/2 bg-slate-700/50 rounded-full" />
          <View className="flex-row mt-1" style={{ gap: 4 }}>
            <View className="h-5 w-14 bg-slate-700/50 rounded-full" />
            <View className="h-5 w-12 bg-slate-700/50 rounded-full" />
            <View className="h-5 w-16 bg-slate-700/50 rounded-full" />
          </View>
        </View>
      </View>
    );
  }

  const categoryColor = getCategoryColor(meal.strCategory);
  const ingredients = getTopIngredients(meal);

  return (
    <View
      style={{ width: CARD_WIDTH, marginBottom: 16 }}
      className="bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/40 shadow-lg"
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
      <View className="p-3">
        {/* Yemek Adı */}
        <Text
          numberOfLines={2}
          style={{ fontSize: 13, fontWeight: '800', color: '#F1F5F9', lineHeight: 18, letterSpacing: -0.2 }}
        >
          {meal.strMeal}
        </Text>

        {/* Ülke/Alan Bilgisi */}
        {meal.strArea ? (
          <View className="flex-row items-center mt-1.5">
            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
              🌍 {meal.strArea}
            </Text>
          </View>
        ) : null}

        {/* İlk 3 Ingredient Pill'leri */}
        {ingredients.length > 0 ? (
          <View className="flex-row flex-wrap mt-2" style={{ gap: 4 }}>
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
                <Text style={{ fontSize: 9, color: '#FB923C', fontWeight: '700' }}>
                  {ing}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
