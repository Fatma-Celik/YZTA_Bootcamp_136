import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, SafeAreaView, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';

import CalorieWidget from '@/components/CaloriWidget';
import RecentMealCard from '@/components/LastlyMealCard';

export default function TabOneScreen() {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRandomMeals = async () => {
    try {
      setLoading(true);
      const requests = Array.from({ length: 5 }).map(() =>
        fetch('https://www.themealdb.com/api/json/v1/1/random.php').then((res) => {
          if (!res.ok) throw new Error('API isteği başarısız');
          return res.json();
        })
      );

      const responses = await Promise.all(requests);
      const fetchedMeals = responses
        .map((data) => (data.meals && data.meals.length > 0 ? data.meals[0] : null))
        .filter(Boolean);

      setMeals(fetchedMeals);
    } catch (err: any) {
      console.error('Fetch Hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomMeals();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0F172A' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <CalorieWidget />

        <View style={{ width: '95%', marginTop: 24, marginBottom: 12 }}>
          <Text className="text-white text-lg font-bold tracking-wide text-left">
            Son Ziyaret Ettiklerin
          </Text>
          <View
            style={{ width: '100%', backgroundColor: '#334155', height: 1.5, marginTop: 8 }}
          />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{width:80,height:80}}>
              <LottieView
              source={require('@/assets/animations/loadingAnimation.json')}
              autoPlay
              loop
              style={{ width: '100%', height: '100%' }}/>
            </View>
            
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 8 }}>
              Son ziyaretler yükleniyor...
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%', alignItems: 'center' }}>
            {meals.map((item, index) => (
              <RecentMealCard key={item.idMeal || index} meal={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
