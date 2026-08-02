import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileStats {
  recipeCount: number;
  shoppingListCount: number;
  allergenCount: number;
}

export const STAT_STORAGE_KEYS = {
  RECIPE_COUNT: '@stats_recipe_count',
  SHOPPING_COUNT: '@stats_shopping_count',
};

// ── Tarif Sayacını Al ──
export async function getRecipeStatCount(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(STAT_STORAGE_KEYS.RECIPE_COUNT);
    return val !== null ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

// ── Tarif Sayacını Arttır (Favorilere eklenince veya tarif bitirilince) ──
export async function incrementRecipeStatCount(): Promise<number> {
  try {
    const current = await getRecipeStatCount();
    const next = current + 1;
    await AsyncStorage.setItem(STAT_STORAGE_KEYS.RECIPE_COUNT, String(next));
    return next;
  } catch {
    return 0;
  }
}

// ── Alışveriş Sayacını Al ──
export async function getShoppingStatCount(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(STAT_STORAGE_KEYS.SHOPPING_COUNT);
    return val !== null ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

// ── Alışveriş Sayacını Arttır (Yeni liste oluşturulunca) ──
export async function incrementShoppingStatCount(): Promise<number> {
  try {
    const current = await getShoppingStatCount();
    const next = current + 1;
    await AsyncStorage.setItem(STAT_STORAGE_KEYS.SHOPPING_COUNT, String(next));
    return next;
  } catch {
    return 0;
  }
}

export function useProfileStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ recipeCount: 0, shoppingListCount: 0, allergenCount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // AsyncStorage'dan sayaçları oku
      const recipeStored = await AsyncStorage.getItem(STAT_STORAGE_KEYS.RECIPE_COUNT);
      let rCount = recipeStored !== null ? parseInt(recipeStored, 10) || 0 : 0;

      const shoppingStored = await AsyncStorage.getItem(STAT_STORAGE_KEYS.SHOPPING_COUNT);
      let sCount = shoppingStored !== null ? parseInt(shoppingStored, 10) || 0 : 0;

      let allergenCount = 0;

      if (user) {
        // Alerjen sayısı
        const allergensRes = await supabase
          .from('user_allergens')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        allergenCount = allergensRes.count ?? 0;

        // İlk açılışta AsyncStorage henüz kayıtlı değilse, Supabase'deki mevcut favori ve liste sayıları ile ilklendir
        if (recipeStored === null) {
          const favRes = await supabase
            .from('favorite_recipes')
            .select('id', { count: 'exact', head: true })
            .eq('kullanici_id', user.id);
          rCount = favRes.count ?? 0;
          await AsyncStorage.setItem(STAT_STORAGE_KEYS.RECIPE_COUNT, String(rCount));
        }

        if (shoppingStored === null) {
          const listRes = await supabase
            .from('shopping_lists')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          sCount = listRes.count ?? 0;
          await AsyncStorage.setItem(STAT_STORAGE_KEYS.SHOPPING_COUNT, String(sCount));
        }
      }

      setStats({
        recipeCount: rCount,
        shoppingListCount: sCount,
        allergenCount,
      });
    } catch (e) {
      console.error('[useProfileStats] Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}