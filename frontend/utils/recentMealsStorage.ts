import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_MEALDB_KEY = '@recent_mealdb_ids_v1';
const MAX_RECENT_MEALS = 10;

export async function addRecentMealId(id: string): Promise<void> {
  if (!id) return;
  try {
    const raw = await AsyncStorage.getItem(RECENT_MEALDB_KEY);
    let list: string[] = raw ? JSON.parse(raw) : [];
    // Remove if duplicate
    list = list.filter((item) => item !== id);
    // Add to beginning
    list.unshift(id);
    // Limit count
    if (list.length > MAX_RECENT_MEALS) {
      list = list.slice(0, MAX_RECENT_MEALS);
    }
    await AsyncStorage.setItem(RECENT_MEALDB_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving recent meal id:', err);
  }
}

export async function getRecentMealIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_MEALDB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error getting recent meal ids:', err);
    return [];
  }
}
