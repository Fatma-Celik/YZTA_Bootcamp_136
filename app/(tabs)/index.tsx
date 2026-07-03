import { StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';

import { Text, View } from '@/components/Themed';
import CalorieWidget from '@/components/CaloriWidget';
import RecentMealCard from '@/components/MealCard';

export default function TabOneScreen() {
  const [meals, setMeals] = useState<any[]>([]);

  const fetchRandomMeal = async () => {
    try {
      //setLoading(true);
      //setError(null);

      const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');

      if (!response.ok) {
        throw new Error('API isteği başarısız oldu kıral!');
      }

      const data = await response.json();

      if (data.meals && data.meals.length > 0) {
        setMeals((prev) => [...prev, data.meals[0]]);
      }
    } catch (err: any) {
      //setError(err.message || 'Bir şeyler ters gitti.');
      console.error('Fetch Hatası:', err);
    } finally {
      //setLoading(false);
    }
  };

  useEffect(() => {
    for (let i = 0; i < 5; i++) {
      fetchRandomMeal();
    }
  }, []);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <CalorieWidget />
      <Text className="text-white text-lg font-bold tracking-wide mx-6 mt-6 mb-3 text-left mr-auto">
        Son Ziyaret Ettiklerin
      </Text>
      <View style={{ width: '88%', alignSelf: 'center', backgroundColor: '#CBD5E1' }} className="h-[2px] w-full mx-6 mb-4" />
      <ScrollView>
        {meals.map((item,index)=>{
          return(
            <RecentMealCard key={index} meal={item}/>
          )
        })}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 0,
    height: 1,
    width: '90%',
    marginRight: "auto"
  },
});
