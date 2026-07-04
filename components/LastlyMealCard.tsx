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
        style={{ width: '90%', alignSelf: 'center' }} 
        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex-row justify-between items-center mb-4"
      >
        <View className="flex-1 space-y-2">
          <View className="h-3 w-16 bg-slate-200 rounded-full" />
          <View className="h-5 w-40 bg-slate-200 rounded-full" />
          <View className="h-3 w-24 bg-slate-200 rounded-full" />
        </View>
        <View className="w-20 h-20 bg-slate-200 rounded-xl" />
      </View>
    );
  }

  return (
    <View 
      style={{ width: '95%', alignSelf: 'center' }} 
      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex-row justify-between items-center mb-4 shadow-sm"
    >
      
      {/* Sol Taraf: Tarif Bilgileri (Kategori, İsim, Ülke) */}
      <View className="flex-1 pr-4">
        {/* Kategori Etiketi */}
        <Text className="text-[11px] font-extrabold text-orange-500 uppercase tracking-widest">
          {meal.strCategory}
        </Text>
        
        {/* Yemek Adı */}
        <Text 
          numberOfLines={2} 
          className="text-slate-800 text-lg font-black tracking-tight mt-1 text-left leading-6"
        >
          {meal.strMeal}
        </Text>
        
        {/* Ülke/Mutfak Bilgisi (Küçük bir dünya emojisiyle tatlı durur) */}
        <View className="flex-row items-center mt-2">
          <Text className="text-slate-400 text-xs font-semibold tracking-wide text-left">
            🌍 {meal.strArea} Mutfağı
          </Text>
        </View>
      </View>

      {/* Sağ Taraf: Optimize Edilmiş Görsel Alanı */}
      <View className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shadow-sm">
        <Image 
          // Dokümantasyondaki /preview takısını kullanarak resmi çok daha hızlı yüklüyoruz
          source={{ uri: `${meal.strMealThumb}/preview` }} 
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

    </View>
  );
}