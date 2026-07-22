import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';
import { Ingredient, BirimOption, parseMiktar } from '@/utils/ingredientUtils';
import IngredientEditCard from '@/components/IngredientEditCard';
import BirimDropdownModal from '@/components/BirimDropdownModal';

// ─────────── Ana Ekran ───────────
export default function IngredientEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ingredients: string }>();

  // Parse ingredients from route params
  const initialIngredients = useMemo(() => {
    try {
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
        } as Ingredient;
      });
    } catch {
      return [] as Ingredient[];
    }
  }, [params.ingredients]);

  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
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

  const { setIngredients: setContextIngredients } = useRecipeFlow();

  const handleConfirm = () => {
    // Malzemeleri context'e kaydet ve tarif detay ekranına yönlendir
    setContextIngredients(ingredients);
    router.push('/scanner/recipe-details');
  };

  // Check if any ingredient has validation errors
  const hasAnyError = ingredients.some((item) => {
    const val = parseFloat(item.miktar);
    return item.miktar.trim() === '' || isNaN(val) || val <= 0;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

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
              backgroundColor: 'rgba(255, 107, 53, 0.08)',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 53, 0.2)',
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
                AI Analiz Sonucu
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
          {/* Onayla ve Devam Et */}
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.8}
            style={{
              backgroundColor: hasAnyError
                ? 'rgba(255, 107, 53, 0.4)'
                : '#FF6B35',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: hasAnyError ? 0 : 0.25,
              shadowRadius: 12,
              elevation: hasAnyError ? 0 : 6,
            }}
          >
            <Ionicons
              name="checkmark-circle"
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
              Onayla ve Devam Et
            </Text>
          </TouchableOpacity>

          {/* İptal Et */}
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
              İptal Et
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
