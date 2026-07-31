import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  theme: 'system' | 'light' | 'dark';
  language: 'tr' | 'en';
  unit_system: 'metric' | 'imperial';
  notifications_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // .single() yerine .maybeSingle() -> 0 satır olsa bile 406 patlamaz
    if (!error) setProfile(data);
    else console.error('Profil çekme hatası:', error.message);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Oturum yok' };
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    return { error: error?.message ?? null };
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}