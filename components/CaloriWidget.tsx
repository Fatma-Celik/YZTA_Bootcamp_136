import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CalorieWidget() {
  // Dinamik Değerler (İleride backend veya state'e kolayca bağlanır)
  const targetCalorie = 3000;
  const consumedCalorie = 2100;
  
  // SVG Çember Hesaplamaları
  const radius = 35; // Çemberin yarıçapı
  const strokeWidth = 7; // Çemberin çizgi kalınlığı
  const circumference = 2 * Math.PI * radius; // Çemberin toplam çevresi (~219.9)
  const strokeDashoffset = circumference - (consumedCalorie / targetCalorie) * circumference;

  return (
    <View style={{width:'95%'}} className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#E24C1B] shadow-lg flex-row justify-between items-center bg-[#FF6B35]">
      
      {/* Sol Sütun: Metin Bilgileri ve Hedefler */}
      <View className="flex-1 pr-4" >
        <Text className="text-white text-base font-medium opacity-90 tracking-wide">
          Hedefler
        </Text>
        
        <View className="mt-2 space-y-1">
          <Text className="text-white text-xl font-extrabold tracking-tight">
            Kilo Verme
          </Text>
          <Text className="text-white text-sm font-medium opacity-80">
            Kas Kütlesi Koruma
          </Text>
        </View>

        {/* Mikro Makro Barları (İçeriği zengin göstermek için tasarıma ek detay) */}
        <View className="mt-4 space-y-1">
          {/* Protein */}
          <View className="flex-row items-center space-x-2">
            <Text className="text-white text-xs font-bold w-8">PRO</Text>
            <View className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <View className="h-full bg-white w-[70%]" />
            </View>
          </View>
          {/* Karbonhidrat */}
          <View className="flex-row items-center space-x-2">
            <Text className="text-white text-xs font-bold w-8">KARB</Text>
            <View className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <View className="h-full bg-white w-[55%]" />
            </View>
          </View>
          <View className="flex-row items-center space-x-2">
            <Text className="text-white text-xs font-bold w-8">YAĞ</Text>
            <View className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <View className="h-full bg-white w-[12%]" />
            </View>
          </View>
        </View>
      </View>

      {/* Sağ Sütun: Cam gibi parlayan Dairesel Progress Bar */}
      <View style={{width:"45%",height:"100%"}} className="items-center justify-center relative bg-white/10 rounded-full border border-white/20">
        
        <Svg width="150" height="150" viewBox="0 0 90 90" className="rotate-[-90deg]">
          {/* Arka Plandaki Sönük Çember (Halkanın Yolu) */}
          <Circle
            cx="45"
            cy="45"
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Ön Plandaki Parlayan Aktif İlerleme Çemberi */}
          <Circle
            cx="45"
            cy="45"
            r={radius}
            stroke="#FFFFFF"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </Svg>

        {/* Çemberin Tam Ortasındaki Kalori Metinleri */}
        <View className="absolute items-center justify-center">
          <Text className="text-white text-xl font-black tracking-tighter">
            {consumedCalorie}
          </Text>
          <Text className="text-white/80 text-[12px] font-bold mt-[-2px]">
            / {targetCalorie} kcal
          </Text>
        </View>

      </View>

    </View>
  );
}