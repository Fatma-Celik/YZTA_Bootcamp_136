import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface WeightEntry {
  id: number;
  weight_kg: number;
  logged_at: string;
}

export function useWeightLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLog = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('weight_logs')
      .select('id, weight_kg, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true })
      .limit(30);
    if (!error && data) setEntries(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  const addEntry = async (weightKg: number) => {
    if (!user) return { error: 'Oturum yok' };
    const { error } = await supabase.from('weight_logs').insert({ user_id: user.id, weight_kg: weightKg });
    if (!error) await fetchLog();
    return { error: error?.message ?? null };
  };

  return { entries, loading, addEntry, refetch: fetchLog };
}