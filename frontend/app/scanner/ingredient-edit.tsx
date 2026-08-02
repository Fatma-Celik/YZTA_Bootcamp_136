import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';
import { Ingredient, BirimOption, parseMiktar } from '@/utils/ingredientUtils';
import IngredientEditCard, { IngredientWithMeta } from '@/components/IngredientEditCard';
import BirimDropdownModal from '@/components/BirimDropdownModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { incrementShoppingStatCount } from '@/hooks/useProfileStats';

const STORAGE_KEY = '@shopping_lists_v1';

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// ─────────── Ana Ekran ───────────
export default function IngredientEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    ingredients?: string;
    missingList?: string;
    isMarketList?: string;
    kaynak?: string;
  }>();
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const { setIngredients: setContextIngredients } = useRecipeFlow();

  const isMarketList = params.isMarketList === 'true';
  const kaynak = params.kaynak || (isMarketList ? 'gemini' : undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Parse ingredients from route params (either recipe ingredients or missing market list)
  const initialIngredients = useMemo(() => {
    try {
      if (isMarketList && params.missingList) {
        const rawList = JSON.parse(params.missingList) as Array<{
          ad: string;
          kategori?: string;
          miktar?: string;
          tahmini_fiyat?: string;
        }>;
        return rawList.map((item, index) => {
          const parsed = parseMiktar(item.miktar || '1 adet');
          return {
            id: `market_ing_${index}_${Date.now()}`,
            ad: item.ad,
            miktar: parsed.miktar,
            birim: parsed.birim,
            kategori: item.kategori,
            tahmini_fiyat: item.tahmini_fiyat,
            kaynak: kaynak,
          } as IngredientWithMeta;
        });
      }

      const rawList = JSON.parse(params.ingredients || '[]') as Array<{
        ad: string;
        miktar: string;
      }>;
      return rawList.map((item, index) => {
        const parsed = parseMiktar(item.miktar);
        return {
          id: `ing_${index}`,
          ad: item.ad,
          miktar: parsed.miktar,
          birim: parsed.birim,
        } as IngredientWithMeta;
      });
    } catch {
      return [] as IngredientWithMeta[];
    }
  }, [params.ingredients, params.missingList, isMarketList]);

  const [ingredients, setIngredients] = useState<IngredientWithMeta[]>(initialIngredients);
  const [dropdownIngredientId, setDropdownIngredientId] = useState<string | null>(null);

  // Find selected ingredient for dropdown
  const selectedIngredient = ingredients.find(
    (i) => i.id === dropdownIngredientId
  );

  // ── Handlers ──
  const handleMiktarChange = (id: string, value: string) => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, miktar: value } : item
      )
    );
  };

  const handleBirimChange = (birim: BirimOption) => {
    if (!dropdownIngredientId) return;
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === dropdownIngredientId ? { ...item, birim } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCancel = () => {
    router.back();
  };



  // Check if any ingredient has validation errors
  const hasAnyError = ingredients.some((item) => {
    const val = parseFloat(item.miktar);
    return item.miktar.trim() === '' || isNaN(val) || val <= 0;
  });

  // Toplam Tahmini Tutar Hesaplama
  const totalEstimatedPrice = useMemo(() => {
    let minSum = 0;
    let maxSum = 0;
    let hasPrice = false;

    ingredients.forEach((ing) => {
      if (ing.tahmini_fiyat) {
        const matches = ing.tahmini_fiyat.match(/(\d+)(?:\s*-\s*(\d+))?/);
        if (matches) {
          hasPrice = true;
          const minVal = parseInt(matches[1], 10);
          const maxVal = matches[2] ? parseInt(matches[2], 10) : minVal;
          minSum += minVal;
          maxSum += maxVal;
        }
      }
    });

    if (!hasPrice) return null;
    return minSum === maxSum ? `${minSum} TL` : `${minSum}-${maxSum} TL`;
  }, [ingredients]);

  const handleConfirm = async () => {
    if (isMarketList) {
      // Eksik market listesini alışveriş listelerine kaydet
      setIsSaving(true);
      try {
        const dateStr = formatDate(new Date());
        const newListItems = ingredients.map((ing) => ({
          idIngredient: ing.id,
          strIngredient: `${ing.ad} (${ing.miktar} ${ing.birim || ''})`.trim(),
          kategori: ing.kategori,
          tahmini_fiyat: ing.tahmini_fiyat,
        }));

        const newList = {
          id: Date.now().toString(),
          title: '1 Haftalık AI Market Listesi',
          priority: 'important' as const,
          createdAt: dateStr,
          isCompleted: false,
          kaynak: 'gemini',
          toplamTahminiTutar: totalEstimatedPrice || undefined,
          items: newListItems,
        };

        // 1. AsyncStorage Kaydı
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        const existingLists = existingData ? JSON.parse(existingData) : [];
        const updatedLists = [newList, ...existingLists].slice(0, 10);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));

        // 2. Supabase Kaydı (kullanıcı giriş yapmışsa)
        if (user) {
          await supabase.from('shopping_lists').insert({
            user_id: user.id,
            title: newList.title,
            items: newList.items,
            kaynak: 'gemini',
            toplam_tutar: totalEstimatedPrice,
          });
        }

        // İstatistik sayacını arttır
        await incrementShoppingStatCount();

        // CustomAlert göster
        showAlert({
          title: 'Başarıyla Oluşturuldu',
          message: '1 haftalık eksik malzeme listeniz alışveriş listenize eklendi.',
          type: 'confirm',
          confirmText: 'Listeyi Gör',
          cancelText: 'Tamam',
          onConfirm: () => {
            router.push('/(tabs)/shopping');
          },
          onCancel: () => {
            router.push('/(tabs)/fridge');
          },
        });
      } catch (err) {
        console.error('[IngredientEdit] Alışveriş listesi kaydetme hatası:', err);
        showAlert({
          title: 'Hata',
          message: 'Liste kaydedilirken bir hata oluştu.',
          type: 'error',
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // Normal tarif akışı: Malzemeleri context'e kaydet ve tarif detay ekranına yönlendir
      setContextIngredients(ingredients);
      router.push('/scanner/recipe-details');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={colors.statusBar} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* ── Header Info ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          {/* Info Badge */}
          <View
            style={{
              backgroundColor: isMarketList ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 107, 53, 0.08)',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: isMarketList ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 107, 53, 0.2)',
            }}
          >
            <Ionicons name={isMarketList ? 'cart' : 'sparkles'} size={18} color={isMarketList ? '#10B981' : '#FF6B35'} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#F1F5F9',
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                {isMarketList ? '1 Haftalık AI Eksik Listesi' : 'AI Analiz Sonucu'}
              </Text>
              <Text
                style={{
                  color: '#94A3B8',
                  fontSize: 12,
                  fontWeight: '500',
                  marginTop: 2,
                }}
              >
                {ingredients.length} malzeme tespit edildi — miktarları düzenleyebilirsiniz
              </Text>
            </View>
          </View>

          {/* Toplam Tahmini Tutar Kartı */}
          {isMarketList && totalEstimatedPrice && (
            <View
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="wallet-outline" size={18} color="#10B981" />
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>Toplam Tahmini Tutar:</Text>
              </View>
              <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>{totalEstimatedPrice}</Text>
            </View>
          )}
        </View>

        {/* ── Ingredient List ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {ingredients.map((item) => (
            <IngredientEditCard
              key={item.id}
              ingredient={item}
              kaynak={kaynak}
              onMiktarChange={handleMiktarChange}
              onBirimPress={(id) => setDropdownIngredientId(id)}
              onDelete={handleDelete}
            />
          ))}

          {ingredients.length === 0 && (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 60,
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
                Malzeme bulunamadı
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ── Bottom Buttons ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: 'rgba(71, 85, 105, 0.2)',
            backgroundColor: '#0F172A',
            gap: 10,
          }}
        >
          {/* Onayla / Eksik Listesi Oluştur */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={hasAnyError || isSaving}
            activeOpacity={0.8}
            style={{
              backgroundColor: hasAnyError
                ? 'rgba(255, 107, 53, 0.4)'
                : isMarketList
                ? '#10B981'
                : '#FF6B35',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              shadowColor: isMarketList ? '#10B981' : '#FF6B35',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: hasAnyError ? 0 : 0.25,
              shadowRadius: 12,
              elevation: hasAnyError ? 0 : 6,
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name={isMarketList ? 'cart-outline' : 'checkmark-circle'}
                  size={20}
                  color={hasAnyError ? 'rgba(255,255,255,0.5)' : '#fff'}
                />
                <Text
                  style={{
                    color: hasAnyError ? 'rgba(255,255,255,0.5)' : '#fff',
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  {isMarketList ? 'Eksik Listesi Oluştur' : 'Onayla ve Devam Et'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* İptal */}
          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            style={{
              backgroundColor: 'rgba(71, 85, 105, 0.3)',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              İptal
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Birim Dropdown Modal ── */}
      <BirimDropdownModal
        visible={!!dropdownIngredientId}
        selected={
          (selectedIngredient?.birim as BirimOption) || 'adet'
        }
        onSelect={handleBirimChange}
        onClose={() => setDropdownIngredientId(null)}
      />
    </SafeAreaView>
  );
}
