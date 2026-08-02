import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export interface MacroStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function useDailyMacros() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [consumed, setConsumed] = useState<MacroStats>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [targets, setTargets] = useState<MacroStats>({ calories: 2000, protein: 130, carbs: 220, fat: 65, fiber: 28 });
  const [loading, setLoading] = useState(true);

  // Mifflin-St Jeor formülüyle profil verilerinden hedefleri hesapla
  useEffect(() => {
    if (!profile) return;
    
    const weight = profile.weight_kg || 70;
    const height = profile.height_cm || 170;
    const gender = profile.gender || 'male';
    const activity = profile.activity_level || 'moderate';
    
    // Yaş hesapla
    let age = 28;
    if (profile.birth_date) {
      const birth = new Date(profile.birth_date);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    // BMR Hesabı
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'kadın') {
      bmr -= 161;
    } else {
      bmr += 5;
    }

    // Aktivite çarpanı
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const mult = multipliers[activity.toLowerCase()] || 1.375;
    const tdee = Math.round(bmr * mult);

    // Kilo verme hedefi varsayılan (TDEE - 500 kcal)
    const calTarget = tdee - 500 > 1200 ? tdee - 500 : 1200;
    const proTarget = Math.round(weight * 2.0); // 2g / kg protein
    const fatTarget = Math.round((calTarget * 0.25) / 9); // %25 yağ
    const carbTarget = Math.round((calTarget - (proTarget * 4 + fatTarget * 9)) / 4); // kalan karbonhidrat
    const fiberTarget = Math.round((calTarget / 1000) * 14) || 28; // ~14g per 1000 kcal

    setTargets({
      calories: calTarget,
      protein: proTarget,
      carbs: carbTarget > 0 ? carbTarget : 100,
      fat: fatTarget,
      fiber: fiberTarget,
    });
  }, [profile]);

  // Bugün tüketilen öğünleri Supabase'den çek
  const fetchTodayMacros = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayStr = startOfDay.toISOString();

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayStr = endOfDay.toISOString();

      let { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDayStr)
        .lte('logged_at', endOfDayStr);

      if (error) {
        // Fallback: spesifik kolon seçimi
        const fallback = await supabase
          .from('meal_logs')
          .select('calories, protein, carbs, fat')
          .eq('user_id', user.id)
          .gte('logged_at', startOfDayStr)
          .lte('logged_at', endOfDayStr);
        data = fallback.data as any;
        error = fallback.error;
      }

      if (!error && data) {
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;
        let fiber = 0;
        data.forEach((meal: any) => {
          calories += meal.calories || 0;
          protein += meal.protein || 0;
          carbs += meal.carbs || 0;
          fat += meal.fat || 0;
          fiber += meal.fiber || meal.lif || 0;
        });
        setConsumed({ calories, protein, carbs, fat, fiber });
      }
    } catch (err) {
      console.error('fetchTodayMacros error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayMacros();
  }, [fetchTodayMacros]);

  // Öğün Ekle
  const logMeal = async (meal: { mealName: string; calories: number; protein: number; carbs: number; fat: number; fiber?: number}) => {
    if (!user) return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
    try {
      const payload: any = {
        user_id: user.id,
        meal_name: meal.mealName,
        calories: Math.round(meal.calories),
        protein: Math.round(meal.protein),
        carbs: Math.round(meal.carbs),
        fat: Math.round(meal.fat),
        fiber: Math.round(meal.fiber || 0)
      };
      let { error } = await supabase.from('meal_logs').insert(payload);

      if (!error) {
        await fetchTodayMacros();
      }

      return { error: error?.message ?? null };
    } catch (err: any) {
      console.error('logMeal exception:', err);
      return { error: err?.message || 'Beklenmeyen bir veritabanı hatası oluştu.' };
    }
  };

  return { consumed, targets, loading, logMeal, refetch: fetchTodayMacros };
}
