import React from 'react';
import { View, Text, Image } from 'react-native';

interface RecentMealCardProps {
  meal: {
    strMeal: string;
    strCategory: string;
    strArea: string;
    strMealThumb: string;
  } | null;
}

export default function RecentMealCard({ meal }: RecentMealCardProps) {
  // Eğer API'den veri henüz gelmediyse iskelet (skeleton) bir görünüm sunalım
  if (!meal) {
    return (
      <View
        style={{ width: '95%', alignSelf: 'center' }}
        className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex-row justify-between items-center mb-4"
      >
        <View className="flex-1 space-y-2">
          <View className="h-3 w-16 bg-slate-700/50 rounded-full" />
          <View className="h-5 w-40 bg-slate-700/50 rounded-full" />
          <View className="h-3 w-24 bg-slate-700/50 rounded-full" />
        </View>
        <View style={{ width: 80, height: 80 }} className="bg-slate-700/50 rounded-xl" />
      </View>
    );
  }

  return (
    <View
      style={{ width: '95%', alignSelf: 'center' }}
      className="p-4 bg-slate-800/80 border border-slate-700/40 rounded-2xl flex-row justify-between items-center mb-4 shadow-lg"
    >
      {/* Sol Taraf: Tarif Bilgileri (Kategori, İsim, Ülke) */}
      <View className="flex-1 pr-4">
        {/* Kategori Etiketi */}
        <Text className="text-[11px] font-extrabold text-[#FF6B35] uppercase tracking-widest">
          {meal.strCategory}
        </Text>

        {/* Yemek Adı */}
        <Text
          numberOfLines={2}
          className="text-slate-100 text-base font-extrabold tracking-tight mt-1 text-left leading-6"
        >
          {meal.strMeal}
        </Text>

        {/* Ülke/Mutfak Bilgisi */}
        <View className="flex-row items-center mt-2">
          <Text className="text-slate-400 text-xs font-semibold tracking-wide text-left">
            🌍 {meal.strArea} Mutfağı
          </Text>
        </View>
      </View>

      {/* Sağ Taraf: Optimize Edilmiş Görsel Alanı */}
      <View
        style={{ width: 80, height: 80 }}
        className="rounded-xl overflow-hidden bg-slate-700/50 shadow-sm"
      >
        <Image
          source={{ uri: `${meal.strMealThumb}/preview` }}
          style={{ width: 80, height: 80 }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}