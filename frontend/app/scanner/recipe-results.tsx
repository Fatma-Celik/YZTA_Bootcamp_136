import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRecipeFlow, BackendRecipe } from '@/hooks/useRecipeFlow';
import { useDailyMacros } from '@/hooks/useDailyMacros';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAlert } from '@/contexts/AlertContext';
import { useTheme } from '@/contexts/ThemeContext';

// ─────────── Besin Değeri Progress Bar ───────────
function NutritionBar({
  label,
  value,
  maxValue,
  color,
  unit,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  unit?: string;
}) {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <View style={{ marginBottom: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
          {label}
        </Text>
        <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: '700' }}>
          {value} {unit}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: 'rgba(71, 85, 105, 0.3)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${percentage}%` as any,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

// ─────────── Tarif Kartı ───────────
function RecipeCard({ 
  recipe, 
  index, 
  onLogMeal 
}: { 
  recipe: BackendRecipe; 
  index: number; 
  onLogMeal: (recipe: BackendRecipe) => void;
}) {
  const router = useRouter();
  const { setSelectedRecipe } = useRecipeFlow();

  // Farklı accent renkleri
  const accentColors = ['#FF6B35', '#10B981', '#818CF8', '#F59E0B', '#EF4444'];
  const accent = accentColors[index % accentColors.length];

  // Süre metni hazırlama
  const sureMetni = [
    recipe.hazirlik_suresi_dk > 0 ? `Hazırlık: ${recipe.hazirlik_suresi_dk} dk` : null,
    recipe.pisirme_suresi_dk > 0 ? `Pişirme: ${recipe.pisirme_suresi_dk} dk` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const handleUseRecipe = () => {
    setSelectedRecipe(recipe);
    router.push('/scanner/recipe-cooking');
  };

  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.3)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <View style={{ padding: 16 }}>
        {/* Tarif İsmi & İkon */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${accent}18`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20 }}>🍽️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 16,
                fontWeight: '800',
                letterSpacing: -0.3,
              }}
              numberOfLines={2}
            >
              {recipe.tarif_adi}
            </Text>
            {sureMetni ? (
              <Text
                style={{
                  color: '#64748B',
                  fontSize: 12,
                  fontWeight: '500',
                  marginTop: 3,
                }}
              >
                ⏱️ {sureMetni}
              </Text>
            ) : null}

            {/* Badges (Kategori, Zorluk, Porsiyon) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {recipe.kategori ? (
                <View
                  style={{
                    backgroundColor: 'rgba(129, 140, 248, 0.15)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(129, 140, 248, 0.3)',
                  }}
                >
                  <Text
                    style={{
                      color: '#818CF8',
                      fontSize: 11,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {recipe.kategori}
                  </Text>
                </View>
              ) : null}

              {recipe.zorluk ? (
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Text
                    style={{
                      color: '#10B981',
                      fontSize: 11,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {recipe.zorluk}
                  </Text>
                </View>
              ) : null}

              {recipe.porsiyon ? (
                <View
                  style={{
                    backgroundColor: 'rgba(236, 72, 153, 0.15)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(236, 72, 153, 0.3)',
                  }}
                >
                  <Text style={{ color: '#EC4899', fontSize: 11, fontWeight: '600' }}>
                    {recipe.porsiyon} Porsiyon
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Malzemeler Özet ── */}
        <View
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 12,
            padding: 12,
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            📝 Malzemeler ({recipe.malzemeler.length} Kalem)
          </Text>
          {recipe.malzemeler.map((m, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: idx < recipe.malzemeler.length - 1 ? 4 : 0,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: accent,
                  marginTop: 6,
                  marginRight: 8,
                  flexShrink: 0,
                }}
              />
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 18,
                  flex: 1,
                }}
              >
                {m.ad} - <Text style={{ color: '#94A3B8' }}>{m.miktar}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* ── Besin Değerleri ── */}
        <Text
          style={{
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          📊 Besin Değerleri ({recipe.porsiyon || 1} porsiyon)
        </Text>

        <NutritionBar
          label="Kalori"
          value={recipe.besin_degerleri?.kalori || 0}
          maxValue={800}
          color="#FF6B35"
          unit="kcal"
        />
        <NutritionBar
          label="Protein"
          value={recipe.besin_degerleri?.protein || 0}
          maxValue={80}
          color="#10B981"
          unit="g"
        />
        <NutritionBar
          label="Karbonhidrat"
          value={recipe.besin_degerleri?.karbonhidrat || 0}
          maxValue={120}
          color="#818CF8"
          unit="g"
        />
        <NutritionBar
          label="Yağ"
          value={recipe.besin_degerleri?.yag || 0}
          maxValue={60}
          color="#F59E0B"
          unit="g"
        />

        {/* ── Tarifi Kullan Butonu ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleUseRecipe}
          style={{
            backgroundColor: '#FF6B35',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            marginTop: 12,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons name="play" size={18} color="#FFF" />
          <Text
            style={{
              color: '#FFF',
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            Tarifi Kullan
          </Text>
        </TouchableOpacity>

          {/* ✅ Öğün Ekle (Yedim) Butonu */}
          <TouchableOpacity
            onPress={() => onLogMeal(recipe)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#10B981',
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8,
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              Yedim (Öğün Olarak Kaydet)
            </Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────── Ana Ekran ───────────
export default function RecipeResultsScreen() {
  const { recipeResponse } = useRecipeFlow();
  const { logMeal } = useDailyMacros();
  const { addNotification } = useNotifications();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const recipes = recipeResponse || [];

  // ✅ Öğün Kaydetme Fonksiyonu
  const handleLogMeal = async (recipe: BackendRecipe) => {
    const calories = recipe.besin_degerleri?.kalori || 0;
    const protein = recipe.besin_degerleri?.protein || 0;
    const carbs = recipe.besin_degerleri?.karbonhidrat || 0;
    const fat = recipe.besin_degerleri?.yag || 0;

    const { error } = await logMeal({
      mealName: recipe.tarif_adi,
      calories,
      protein,
      carbs,
      fat,
    });

    if (error) {
      showAlert({ title: 'Hata', message: 'Öğün kaydedilemedi: ' + error, type: 'error' });
      addNotification(`Öğün kaydedilemedi: ${recipe.tarif_adi}`, 'error');
    } else {
      showAlert({ title: 'Afiyet Olsun! 🍽️', message: `${recipe.tarif_adi} günlük tüketim kaydınıza başarıyla eklendi.`, type: 'success' });
      addNotification(`🍽️ ${recipe.tarif_adi} öğün olarak kaydedildi (${calories} kcal)`, 'success');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <StatusBar barStyle={colors.statusBar} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Badge ── */}
        <View
          style={{
            backgroundColor: 'rgba(255, 107, 53, 0.08)',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: 'rgba(255, 107, 53, 0.2)',
            marginBottom: 16,
          }}
        >
          <Ionicons name="sparkles" size={18} color="#FF6B35" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              AI Tarif Önerileri
            </Text>
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 12,
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              {recipes.length} tarif üretildi — "Tarifi Kullan" butonuna basarak pişirmeye başlayın
            </Text>
          </View>
        </View>

        {/* ── Tarif Listesi ── */}
        {recipes.map((recipe, idx) => (
          <RecipeCard 
            key={idx} 
            recipe={recipe} 
            index={idx} 
            onLogMeal={handleLogMeal} 
          />
        ))}

        {recipes.length === 0 && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
            }}
          >
            <Ionicons name="alert-circle-outline" size={48} color="#475569" />
            <Text
              style={{
                color: '#64748B',
                fontSize: 16,
                fontWeight: '600',
                marginTop: 12,
              }}
            >
              Tarif bulunamadı
            </Text>
          </View>
        )}
        {/* ── Tahmini Veri Uyarısı ── */}
        <View
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.06)',
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginTop: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            borderWidth: 1,
            borderColor: 'rgba(99, 102, 241, 0.18)',
          }}
        >
          <Ionicons name="information-circle-outline" size={18} color="#818CF8" style={{ marginTop: 1 }} />
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 18 }}>
            Gösterilen tarif besin değerleri yapay zeka tarafından hesaplanan tahmini değerlerdir. Kullanılan malzemelerin markasına ve miktarına göre değişiklik gösterebilir.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
