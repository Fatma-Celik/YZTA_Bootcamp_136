import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';

export interface MealLogItem {
  id?: string | number;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  logged_at: string;
}

export default function MyMealsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { addNotification } = useNotifications();
  const [meals, setMeals] = useState<MealLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Supabase'den öğün geçmişini çek
  const fetchMyMeals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) {
        console.error('Meal logs fetch error:', error);
      } else if (data) {
        setMeals(data as MealLogItem[]);
      }
    } catch (err) {
      console.error('fetchMyMeals exception:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchMyMeals();
    }, [fetchMyMeals])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyMeals();
  };

  // Tarih ve saat formatlama
  const formatMealTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      if (date.toDateString() === today.toDateString()) {
        return `Bugün, ${timeStr}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Dün, ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        return `${dateStr}, ${timeStr}`;
      }
    } catch {
      return isoString;
    }
  };

  // Öğün silme onay dialogu (CustomAlert kullanarak)
  const confirmDeleteMeal = (meal: MealLogItem) => {
    showAlert({
      title: 'Öğün Kaydı Silinsin mi?',
      message: `"${meal.meal_name}" kaydı öğünlerinizden kaldırılacaktır. Bu işlem geri alınamaz.`,
      type: 'confirm',
      confirmText: 'Sil',
      cancelText: 'İptal',
      onConfirm: async () => {
        try {
          let query = supabase.from('meal_logs').delete().eq('user_id', user?.id);
          if (meal.id) {
            query = query.eq('id', meal.id);
          } else {
            query = query.eq('logged_at', meal.logged_at).eq('meal_name', meal.meal_name);
          }

          const { error } = await query;

          if (error) {
            showAlert({
              title: 'Hata',
              message: 'Öğün silinirken bir sorun oluştu: ' + error.message,
              type: 'error',
            });
          } else {
            addNotification(`🗑️ "${meal.meal_name}" öğün kaydı silindi`, 'info');
            fetchMyMeals();
          }
        } catch (err: any) {
          console.error('Delete meal error:', err);
        }
      },
    });
  };

  // Kart Render (Progress Bar Kesinlikle Kullanılmıyor)
  const renderMealCard = ({ item }: { item: MealLogItem }) => {
    const fiberVal = item.fiber ?? 0;

    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 16,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          shadowColor: colors.cardBorder,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Üst Satır: Öğün Adı + Tarih + Sil Butonu */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}
              numberOfLines={2}
            >
              {item.meal_name}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
              🕒 {formatMealTime(item.logged_at)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => confirmDeleteMeal(item)}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Enerji Bilgisi */}
        <View
          style={{
            backgroundColor: colors.inputBg,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>Toplam Enerji</Text>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '900' }}>
            {item.calories} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>kcal</Text>
          </Text>
        </View>

        {/* 4 Makro Rozet Grid */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
          {[
            { label: 'PRO', value: `${item.protein}g`, color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.12)' },
            { label: 'KARB', value: `${item.carbs}g`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
            { label: 'YAĞ', value: `${item.fat}g`, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
            { label: 'LİF', value: `${fiberVal}g`, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' },
          ].map((m) => (
            <View
              key={m.label}
              style={{
                flex: 1,
                backgroundColor: m.bg,
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 10,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: `${m.color}30`,
              }}
            >
              <Text style={{ color: m.color, fontSize: 10, fontWeight: '800', marginBottom: 2 }}>{m.label}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '800' }}>{m.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Üst Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Profil</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>Öğünlerim</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Liste */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 14, fontWeight: '600' }}>
            Öğün geçmişiniz yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          renderItem={renderMealCard}
          keyExtractor={(item, index) => item.id ? String(item.id) : `${item.logged_at}-${index}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 26,
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="restaurant-outline" size={40} color="#F59E0B" />
              </View>
              <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
                Henüz Kayıtlı Öğün Yok
              </Text>
              <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20 }}>
                Tarifler sayfasından veya makro analiz ekranından öğünlerinizi kaydederek burada görüntüleyebilirsiniz.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
