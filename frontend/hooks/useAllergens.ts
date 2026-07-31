import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserAllergen {
  id: number;
  allergen_name: string;
  external_id: string | null;
  image_url: string | null;
}

export function useAllergens() {
  const { user } = useAuth();
  const [allergens, setAllergens] = useState<UserAllergen[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllergens = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_allergens')
      .select('id, allergen_name, external_id, image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setAllergens(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAllergens(); }, [fetchAllergens]);

  const addAllergens = async (items: { name: string; externalId: string; imageUrl: string }[]) => {
    if (!user) return { error: 'Oturum yok' };
    const rows = items.map((i) => ({
      user_id: user.id,
      allergen_name: i.name,
      external_id: i.externalId,
      image_url: i.imageUrl,
    }));
    const { error } = await supabase.from('user_allergens').upsert(rows, { onConflict: 'user_id,allergen_name' });
    if (!error) await fetchAllergens();
    return { error: error?.message ?? null };
  };

  const removeAllergen = async (id: number) => {
    const { error } = await supabase.from('user_allergens').delete().eq('id', id);
    if (!error) setAllergens((prev) => prev.filter((a) => a.id !== id));
    return { error: error?.message ?? null };
  };

  return { allergens, loading, addAllergens, removeAllergen, refetch: fetchAllergens };
}