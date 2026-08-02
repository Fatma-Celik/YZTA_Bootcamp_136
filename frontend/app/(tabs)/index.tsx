import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import CalorieWidget from '@/components/CaloriWidget';
import RecentMealCard from '@/components/LastlyMealCard';
import NotificationPanel from '@/components/NotificationPanel';
import { getRecentMealIds } from '@/utils/recentMealsStorage';
import { useRecipeFlow, transformMealDBDetail } from '@/hooks/useRecipeFlow';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabOneScreen() {
  const router = useRouter();
  const { setMealDbRecipe, setSelectedRecipe } = useRecipeFlow();
  const { colors } = useTheme();
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRecentMeals = useCallback(async () => {
    try {
      setLoading(true);
      const ids = await getRecentMealIds();
      
      if (ids && ids.length > 0) {
        // Ziyaret edilen gerçek tarifleri ID ile çek
        const requests = ids.map((id) =>
          fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        );
        const responses = await Promise.all(requests);
        const fetchedMeals = responses
          .map((data) => (data?.meals && data.meals.length > 0 ? data.meals[0] : null))
          .filter(Boolean);

        setMeals(fetchedMeals);
      } else {
        // Henüz ziyaret edilmediyse varsayılan rastgele tarifler yükle
        const requests = Array.from({ length: 4 }).map(() =>
          fetch('https://www.themealdb.com/api/json/v1/1/random.php')
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        );
        const responses = await Promise.all(requests);
        const fetchedMeals = responses
          .map((data) => (data?.meals && data.meals.length > 0 ? data.meals[0] : null))
          .filter(Boolean);

        setMeals(fetchedMeals);
      }
    } catch (err: any) {
      console.error('Recent Meals Fetch Hatası:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecentMeals();
    }, [fetchRecentMeals])
  );

  const handleMealClick = (rawMeal: any) => {
    if (!rawMeal) return;
    const detail = transformMealDBDetail(rawMeal);
    setSelectedRecipe(null);
    setMealDbRecipe(detail);
    router.push('/scanner/recipe-cooking');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.statusBar} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 60, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <CalorieWidget />

        <View style={{ width: '95%', marginTop: 24, marginBottom: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.3, textAlign: 'left' }}>
            Son Ziyaret Ettiklerin
          </Text>
          <View
            style={{ width: '100%', backgroundColor: colors.divider, height: 1.5, marginTop: 8 }}
          />
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 80, height: 80 }}>
              <LottieView
                source={require('@/assets/animations/loadingAnimation.json')}
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 8 }}>
              Son ziyaretler yükleniyor...
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%', alignItems: 'center' }}>
            {meals.map((item, index) => (
              <RecentMealCard
                key={item.idMeal || index}
                meal={item}
                onPress={() => handleMealClick(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Buzdolabım FAB ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/fridge')}
        style={{
          position: 'absolute',
          bottom: 70,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 8,
          zIndex: 100,
        }}
      >
        <MaterialCommunityIcons name="fridge" size={30} color="white" />
      </TouchableOpacity>

      {/* ── Bildirim Paneli ── */}
      <NotificationPanel />
    </View>
  );
}

const styles = StyleSheet.create({});
