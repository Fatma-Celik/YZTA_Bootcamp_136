import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
        <StatusBar barStyle="light-content" />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="alert-circle-outline" size={48} color="#475569" />
          <Text
            style={{
              color: '#64748B',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

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
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="nutrition" size={24} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: '#F1F5F9',
                    fontSize: 18,
                    fontWeight: '800',
                    letterSpacing: -0.3,
                    lineHeight: 24,
                  }}
                  numberOfLines={3}
                >
                  {yemek_adi}
                </Text>
              </View>
            </View>

            {/* Öğün Badge */}
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.25)',
              }}
            >
              <Text
                style={{
                  color: '#10B981',
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                🍽️ {ogun}
              </Text>
            </View>
          </View>

          {/* ── Kalori Kartı (Büyük Gösterim) ── */}
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 20,
              padding: 24,
              marginBottom: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 53, 0.2)',
            }}
          >
            <Text
              style={{
                color: '#64748B',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Toplam Kalori
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text
                style={{
                  color: '#FF6B35',
                  fontSize: 52,
                  fontWeight: '900',
                  letterSpacing: -2,
                }}
              >
                {besin_degerleri.kalori}
              </Text>
              <Text
                style={{
                  color: '#FF6B35',
                  fontSize: 18,
                  fontWeight: '700',
                  marginLeft: 4,
                  opacity: 0.7,
                }}
              >
                kcal
              </Text>
            </View>

            {/* Mini makro gösterimi */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 16,
                gap: 16,
              }}
            >
              {[
                { label: 'Protein', value: besin_degerleri.protein, unit: 'g', color: '#10B981' },
                { label: 'Karb.', value: besin_degerleri.karbonhidrat, unit: 'g', color: '#818CF8' },
                { label: 'Yağ', value: besin_degerleri.yag, unit: 'g', color: '#F59E0B' },
                { label: 'Lif', value: besin_degerleri.lif, unit: 'g', color: '#38BDF8' },
              ].map((item) => (
                <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: item.color,
                      marginBottom: 6,
                    }}
                  />
                  <Text
                    style={{
                      color: '#F1F5F9',
                      fontSize: 16,
                      fontWeight: '800',
                    }}
                  >
                    {item.value}{item.unit}
                  </Text>
                  <Text
                    style={{
                      color: '#64748B',
                      fontSize: 11,
                      fontWeight: '500',
                      marginTop: 2,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Besin Değerleri Progress Barlar ── */}
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
              📊 Makro Besin Değerleri
            </Text>

            <AnimatedNutritionBar
              label="Protein"
              value={besin_degerleri.protein}
              maxValue={150}
              color="#10B981"
              unit="g"
              delay={200}
            />
            <AnimatedNutritionBar
              label="Karbonhidrat"
              value={besin_degerleri.karbonhidrat}
              maxValue={300}
              color="#818CF8"
              unit="g"
              delay={400}
            />
            <AnimatedNutritionBar
              label="Yağ"
              value={besin_degerleri.yag}
              maxValue={100}
              color="#F59E0B"
              unit="g"
              delay={600}
            />
            <AnimatedNutritionBar
              label="Lif"
              value={besin_degerleri.lif}
              maxValue={50}
              color="#38BDF8"
              unit="g"
              delay={800}
            />
          </View>

          {/* ── Değerlendirme Kartı ── */}
          {degerlendirme ? (
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(129, 140, 248, 0.2)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(129, 140, 248, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="clipboard" size={18} color="#818CF8" />
                </View>
                <Text
                  style={{
                    color: '#F1F5F9',
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                >
                  Değerlendirme
                </Text>
              </View>
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 14,
                  fontWeight: '500',
                  lineHeight: 22,
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
                backgroundColor: '#1E293B',
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(245, 158, 11, 0.2)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="bulb" size={18} color="#F59E0B" />
                </View>
                <Text
                  style={{
                    color: '#F1F5F9',
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                >
                  Öneri
                </Text>
              </View>
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 14,
                  fontWeight: '500',
                  lineHeight: 22,
                }}
              >
                {oneri}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
