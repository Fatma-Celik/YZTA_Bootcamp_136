import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileStats {
  recipeCount: number;
  shoppingListCount: number;
  allergenCount: number;
}

export function useProfileStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ recipeCount: 0, shoppingListCount: 0, allergenCount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [recipes, shoppingLists, allergens] = await Promise.all([
      supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
      supabase.from('shopping_lists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('user_allergens').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    setStats({
      recipeCount: recipes.count ?? 0,
      shoppingListCount: shoppingLists.count ?? 0,
      allergenCount: allergens.count ?? 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}