import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipeFlow, BackendRecipe } from '@/hooks/useRecipeFlow';
import { BASE_URL, ENDPOINTS } from '@/constants/ApiConfig';

// ─── Favori Tarif Tipi (API response) ───
interface FavoriteRecipe extends BackendRecipe {
  favori_id?: string | number;
}

// ─── Kategori Renk Haritası ───
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'rgba(129, 140, 248, 0.15)',
    text: '#818CF8',
    border: 'rgba(129, 140, 248, 0.3)',
  },
  kahvaltı: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  'ana yemek': {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#EF4444',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  tatlı: {
    bg: 'rgba(236, 72, 153, 0.15)',
    text: '#EC4899',
    border: 'rgba(236, 72, 153, 0.3)',
  },
  salata: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#10B981',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  çorba: {
    bg: 'rgba(255, 107, 53, 0.15)',
    text: '#FF6B35',
    border: 'rgba(255, 107, 53, 0.3)',
  },
};

function getCategoryColor(category: string) {
  const key = category?.toLowerCase?.() || '';
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

// ─── Favori Tarif Kartı ───
function FavoriteRecipeCard({
  recipe,
  onPress,
}: {
  recipe: FavoriteRecipe;
  onPress: () => void;
}) {
  const catColor = getCategoryColor(recipe.kategori);
  const totalTime = (recipe.hazirlik_suresi_dk || 0) + (recipe.pisirme_suresi_dk || 0);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.3)',
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Sol: Renkli İkon */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 15,
          backgroundColor: 'rgba(255, 107, 53, 0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="flame" size={24} color="#FF6B35" />
      </View>

      {/* Orta: Bilgiler */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: '#F1F5F9',
            fontSize: 15,
            fontWeight: '700',
            letterSpacing: -0.2,
            marginBottom: 6,
          }}
          numberOfLines={1}
        >
          {recipe.tarif_adi}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Kategori Badge */}
          {recipe.kategori ? (
            <View
              style={{
                backgroundColor: catColor.bg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: catColor.border,
              }}
            >
              <Text
                style={{
                  color: catColor.text,
                  fontSize: 11,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {recipe.kategori}
              </Text>
            </View>
          ) : null}

          {/* Süre */}
          {totalTime > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>
                {totalTime} dk
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sağ: Ok */}
      <Ionicons name="chevron-forward" size={18} color="#475569" />
    </TouchableOpacity>
  );
}

// ─── Ana Ekran ───
export default function FavoriteRecipesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedRecipe, setFavoriteId } = useRecipeFlow();

  const [recipes, setRecipes] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    setError(null);

    try {
      console.log(user.id);
      const response = await fetch(`${BASE_URL}${ENDPOINTS.favoriler}/${user.id}`);
      if (!response.ok) throw new Error('Favoriler yüklenemedi');
      const data = await response.json();
      console.log(data)
      // API array döndürüyor
      const fav_list = Array.isArray(data) ? data : data.favoriler || [];
      console.log('Favori tarifler:', fav_list);
      setRecipes(fav_list);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRecipePress = (recipe: FavoriteRecipe) => {
    // selectedRecipe'i context'e set et, favoriteId'yi de (varsa)
    setSelectedRecipe(recipe);
    if (recipe.favori_id) {
      setFavoriteId(String(recipe.favori_id));
    }
    router.push('/scanner/recipe-cooking');
  };

  // ── Loading State ──
  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}
        edges={['bottom']}
      >
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 12 }}>
          Favori tarifler yükleniyor...
        </Text>
      </SafeAreaView>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
        edges={['bottom']}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Ionicons name="cloud-offline-outline" size={34} color="#EF4444" />
        </View>
        <Text style={{ color: '#F1F5F9', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
          Yüklenemedi
        </Text>
        <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            fetchFavorites();
          }}
          style={{
            backgroundColor: '#FF6B35',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Empty State ──
  if (recipes.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
        edges={['bottom']}
      >
        <StatusBar barStyle="light-content" />
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="heart-outline" size={40} color="#EF4444" />
        </View>

        <Text
          style={{
            color: '#F1F5F9',
            fontSize: 20,
            fontWeight: '800',
            letterSpacing: -0.3,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Henüz Favori Tarifiniz Yok
        </Text>
        <Text
          style={{
            color: '#64748B',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center',
            lineHeight: 21,
          }}
        >
          Beğendiğiniz tarifleri kalp ikonuna basarak favorilere ekleyebilirsiniz.
        </Text>
      </SafeAreaView>
    );
  }

  // ── Liste Görünümü ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Üst Bilgi */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Ionicons name="heart" size={14} color="#EF4444" />
          <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>
            {recipes.length} favori tarif
          </Text>
        </View>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item, index) =>
          item.favori_id ? String(item.favori_id) : `fav-${index}`
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
        renderItem={({ item }) => (
          <FavoriteRecipeCard
            recipe={item}
            onPress={() => handleRecipePress(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}
