import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';
import { useDailyMacros } from '@/hooks/useDailyMacros';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAlert } from '@/contexts/AlertContext';
import { useTheme } from '@/contexts/ThemeContext';

// ─────────── Animasyonlu Progress Bar ───────────
function AnimatedNutritionBar({
  label,
  value,
  maxValue,
  color,
  unit,
  delay,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  unit: string;
  delay: number;
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percentage,
      duration: 1000,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const widthInterpolation = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text style={{ color: '#CBD5E1', fontSize: 14, fontWeight: '600' }}>
          {label}
        </Text>
        <Text style={{ color: color, fontSize: 14, fontWeight: '800' }}>
          {value}{unit}
        </Text>
      </View>
      <View
        style={{
          height: 10,
          backgroundColor: 'rgba(71, 85, 105, 0.2)',
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width: widthInterpolation,
            backgroundColor: color,
            borderRadius: 5,
          }}
        />
      </View>
      <Text
        style={{
          color: '#475569',
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
          textAlign: 'right',
        }}
      >
        {Math.round(percentage)}% günlük değer
      </Text>
    </View>
  );
}

// ─────────── Ana Ekran ───────────
export default function MacroResultsScreen() {
  const { macroResponse } = useRecipeFlow();
  const { logMeal } = useDailyMacros();
  const { addNotification } = useNotifications();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // Öğün kaydetme handler'ı
  const handleLogMeal = async () => {
    if (!macroResponse || saving || isLogged) return;
    setSaving(true);

    try {
      const { error } = await logMeal({
        mealName: macroResponse.yemek_adi,
        calories: macroResponse.besin_degerleri?.kalori || 0,
        protein: macroResponse.besin_degerleri?.protein || 0,
        carbs: macroResponse.besin_degerleri?.karbonhidrat || 0,
        fat: macroResponse.besin_degerleri?.yag || 0,
        fiber: macroResponse.besin_degerleri?.lif || 0,
      });

      if (error) {
        showAlert({ title: 'Hata', message: 'Öğün kaydedilemedi: ' + error, type: 'error' });
        addNotification(`Öğün kaydedilemedi: ${macroResponse.yemek_adi}`, 'error');
      } else {
        setIsLogged(true);
        addNotification(`🍽️ ${macroResponse.yemek_adi} öğünlerinize eklendi! (${macroResponse.besin_degerleri?.kalori || 0} kcal)`, 'success');
        showAlert({ title: 'Afiyet Olsun! 🍽️', message: `${macroResponse.yemek_adi} günlük öğünlerinize başarıyla kaydedildi.`, type: 'success' });
      }
    } catch (err: any) {
      console.error('handleLogMeal exception:', err);
      showAlert({ title: 'Hata', message: 'İşlem sırasında bir hata oluştu: ' + (err?.message || err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!macroResponse) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <StatusBar barStyle={colors.statusBar} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 16,
              fontWeight: '600',
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            Besin değeri verisi bulunamadı
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { yemek_adi, ogun, besin_degerleri, degerlendirme, oneri } = macroResponse;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <StatusBar barStyle={colors.statusBar} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* ── Yemek Adı + Öğün Header ── */}
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.2)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                }}
              >
                <Text
                  style={{
                    color: '#10B981',
                    fontSize: 12,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  {ogun || 'Öğün'}
                </Text>
              </View>
            </View>

            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: -0.4,
              }}
            >
              {yemek_adi}
            </Text>
          </View>

          {/* ── Besin Değerleri Kartı ── */}
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.3)',
            }}
          >
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              📊 Besin Değerleri
            </Text>

            <AnimatedNutritionBar
              label="Kalori"
              value={besin_degerleri?.kalori || 0}
              maxValue={800}
              color="#FF6B35"
              unit=" kcal"
              delay={100}
            />
            <AnimatedNutritionBar
              label="Protein"
              value={besin_degerleri?.protein || 0}
              maxValue={80}
              color="#10B981"
              unit="g"
              delay={200}
            />
            <AnimatedNutritionBar
              label="Karbonhidrat"
              value={besin_degerleri?.karbonhidrat || 0}
              maxValue={120}
              color="#818CF8"
              unit="g"
              delay={300}
            />
            <AnimatedNutritionBar
              label="Yağ"
              value={besin_degerleri?.yag || 0}
              maxValue={60}
              color="#F59E0B"
              unit="g"
              delay={400}
            />
            <AnimatedNutritionBar
              label="Lif"
              value={besin_degerleri?.lif || 0}
              maxValue={30}
              color="#EC4899"
              unit="g"
              delay={500}
            />
          </View>

          {/* ── Değerlendirme Kartı ── */}
          {degerlendirme ? (
            <View
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.25)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text
                  style={{ color: '#10B981', fontSize: 14, fontWeight: '700' }}
                >
                  Değerlendirme
                </Text>
              </View>
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 20,
                }}
              >
                {degerlendirme}
              </Text>
            </View>
          ) : null}

          {/* ── Öneri Kartı ── */}
          {oneri ? (
            <View
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 18,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: 'rgba(245, 158, 11, 0.25)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                <Text
                  style={{ color: '#F59E0B', fontSize: 14, fontWeight: '700' }}
                >
                  Beslenme Önerisi
                </Text>
              </View>
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 20,
                }}
              >
                {oneri}
              </Text>
            </View>
          ) : null}

          {/* ── Öğün Kaydet (Yedim) Butonu ── */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogMeal}
            disabled={saving || isLogged}
            style={{
              backgroundColor: isLogged ? '#334155' : '#10B981',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isLogged ? 0 : 0.3,
              shadowRadius: 8,
              elevation: isLogged ? 0 : 6,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isLogged ? 'checkmark-circle' : 'add-circle-outline'}
                  size={20}
                  color="#FFF"
                />
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                  {isLogged ? 'Öğün Kaydedildi ✓' : 'Günlük Öğünlerime Ekle'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
