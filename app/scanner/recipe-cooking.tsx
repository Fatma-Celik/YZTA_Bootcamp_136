import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';

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

// ─────────── Katlanabilir Malzeme Listesi ───────────
function IngredientCollapsible({
  ingredients,
}: {
  ingredients: Array<{ ad: string; miktar: string }>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.3)',
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: 'rgba(255, 107, 53, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="basket" size={19} color="#FF6B35" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
            Malzemeler
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', marginTop: 1 }}>
            {ingredients.length} malzeme • Dokunarak inceleyin
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#64748B"
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: 'rgba(71, 85, 105, 0.2)',
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
          }}
        >
          {ingredients.map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: idx < ingredients.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(71, 85, 105, 0.15)',
              }}
            >
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 14,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                {item.ad}
              </Text>
              <Text
                style={{
                  color: '#94A3B8',
                  fontSize: 13,
                  fontWeight: '500',
                  marginLeft: 8,
                }}
              >
                {item.miktar}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────── Ana Ekran ───────────
export default function RecipeCookingScreen() {
  const router = useRouter();
  const { selectedRecipe } = useRecipeFlow();

  // Pişirme modu state'leri
  const [isCookingActive, setIsCookingActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isFinishModalVisible, setIsFinishModalVisible] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Kronometre kontrolü
  useEffect(() => {
    if (isCookingActive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCookingActive]);

  // Donanım geri tuşu (Android) koruması
  useEffect(() => {
    const onBackPress = () => {
      if (isCookingActive) {
        confirmExit();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isCookingActive]);

  // Kronometre biçimlendirme (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Çıkış Onayı
  const confirmExit = () => {
    Alert.alert(
      'Tariften Çıkılsın mı?',
      'Tarif modundan çıkmak istediğinize emin misiniz? Kronometre sıfırlanacaktır.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => {
            setIsCookingActive(false);
            setElapsedSeconds(0);
            setCompletedSteps([]);
            router.back();
          },
        },
      ]
    );
  };

  if (!selectedRecipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#94A3B8', fontSize: 16 }}>Tarif bilgisi bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: '#FF6B35', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Süre Metni
  const sureMetni = [
    selectedRecipe.hazirlik_suresi_dk > 0 ? `Hazırlık: ${selectedRecipe.hazirlik_suresi_dk} dk` : null,
    selectedRecipe.pisirme_suresi_dk > 0 ? `Pişirme: ${selectedRecipe.pisirme_suresi_dk} dk` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  // Adım tamamlandı/tamamlanmadı değiştirme
  const toggleStep = (index: number) => {
    if (!isCookingActive) return;
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((i) => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  // İlk tamamlanmamış aktif adım indeksi
  const firstUncompletedIndex = selectedRecipe.yapilis_adimlari.findIndex(
    (_, idx) => !completedSteps.includes(idx)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      {/* ── Üst Action / Header Bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(71, 85, 105, 0.2)',
          backgroundColor: '#0F172A',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (isCookingActive) {
              confirmExit();
            } else {
              router.back();
            }
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingVertical: 4,
            paddingRight: 8,
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#FF6B35" />
          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600' }}>
            Tarifler
          </Text>
        </TouchableOpacity>

        {/* ── Mod Butonu / Sayaç ── */}
        {!isCookingActive ? (
          <TouchableOpacity
            onPress={() => setIsCookingActive(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#FF6B35',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="play" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>
              Tarifi Kullan
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Canlı Kronometre */}
            <View
              style={{
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                borderWidth: 1,
                borderColor: '#FF6B35',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="time" size={16} color="#FF6B35" />
              <Text
                style={{
                  color: '#FF6B35',
                  fontSize: 14,
                  fontWeight: '800',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatTime(elapsedSeconds)}
              </Text>
            </View>

            {/* Tariften Çık */}
            <TouchableOpacity
              onPress={confirmExit}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>
                Çık
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tarif Başlığı & Meta Detaylar ── */}
        <View
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)',
          }}
        >
          <Text
            style={{
              color: '#F1F5F9',
              fontSize: 20,
              fontWeight: '800',
              letterSpacing: -0.4,
              marginBottom: 6,
            }}
          >
            {selectedRecipe.tarif_adi}
          </Text>

          {sureMetni ? (
            <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500', marginBottom: 10 }}>
              ⏱️ {sureMetni}
            </Text>
          ) : null}

          {/* Badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {selectedRecipe.kategori ? (
              <View
                style={{
                  backgroundColor: 'rgba(129, 140, 248, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(129, 140, 248, 0.3)',
                }}
              >
                <Text
                  style={{
                    color: '#818CF8',
                    fontSize: 12,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {selectedRecipe.kategori}
                </Text>
              </View>
            ) : null}

            {selectedRecipe.zorluk ? (
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
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {selectedRecipe.zorluk}
                </Text>
              </View>
            ) : null}

            {selectedRecipe.porsiyon ? (
              <View
                style={{
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(236, 72, 153, 0.3)',
                }}
              >
                <Text style={{ color: '#EC4899', fontSize: 12, fontWeight: '600' }}>
                  {selectedRecipe.porsiyon} Porsiyon
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Besin Değerleri Barları ── */}
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            📊 Besin Değerleri ({selectedRecipe.porsiyon || 1} porsiyon)
          </Text>

          <NutritionBar
            label="Kalori"
            value={selectedRecipe.besin_degerleri?.kalori || 0}
            maxValue={800}
            color="#FF6B35"
            unit="kcal"
          />
          <NutritionBar
            label="Protein"
            value={selectedRecipe.besin_degerleri?.protein || 0}
            maxValue={80}
            color="#10B981"
            unit="g"
          />
          <NutritionBar
            label="Karbonhidrat"
            value={selectedRecipe.besin_degerleri?.karbonhidrat || 0}
            maxValue={120}
            color="#818CF8"
            unit="g"
          />
          <NutritionBar
            label="Yağ"
            value={selectedRecipe.besin_degerleri?.yag || 0}
            maxValue={60}
            color="#F59E0B"
            unit="g"
          />
        </View>

        {/* ── Katlanabilir Malzeme Listesi ── */}
        <IngredientCollapsible ingredients={selectedRecipe.malzemeler} />

        {/* ── Uygulanış Adımları ── */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              👨‍🍳 Uygulanış Adımları
            </Text>
            {isCookingActive && (
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600' }}>
                {completedSteps.length} / {selectedRecipe.yapilis_adimlari.length} Tamamlandı
              </Text>
            )}
          </View>

          {selectedRecipe.yapilis_adimlari.map((step, idx) => {
            const isCompleted = completedSteps.includes(idx);
            const isCurrent = isCookingActive && !isCompleted && idx === firstUncompletedIndex;

            // Yeşil tonları tamamlanan adımlar için, Turuncu güncel adım için
            let borderColor = 'rgba(71, 85, 105, 0.3)';
            let backgroundColor = '#1E293B';

            if (isCompleted) {
              borderColor = '#10B981'; // Yeşil border
              backgroundColor = 'rgba(16, 185, 129, 0.12)'; // Yeşil arkaplan
            } else if (isCurrent) {
              borderColor = '#FF6B35'; // Güncel adım turuncu border
              backgroundColor = 'transparent'; // Şeffaf arkaplan
            }

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={isCookingActive ? 0.7 : 1}
                onPress={() => toggleStep(idx)}
                style={{
                  backgroundColor,
                  borderWidth: isCurrent || isCompleted ? 2 : 1,
                  borderColor,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
              >
                {/* Sol İkon / Adım Numarası */}
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isCompleted
                      ? '#10B981'
                      : isCurrent
                      ? 'rgba(255, 107, 53, 0.15)'
                      : 'rgba(71, 85, 105, 0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                  ) : (
                    <Text
                      style={{
                        color: isCurrent ? '#FF6B35' : '#94A3B8',
                        fontSize: 13,
                        fontWeight: '800',
                      }}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>

                {/* Adım İçeriği */}
                <Text
                  style={{
                    color: isCompleted ? '#E2E8F0' : '#CBD5E1',
                    fontSize: 14,
                    fontWeight: isCurrent ? '700' : '500',
                    lineHeight: 21,
                    flex: 1,
                    textDecorationLine: isCompleted ? 'line-through' : 'none',
                    opacity: isCompleted ? 0.8 : 1,
                  }}
                >
                  {step}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tarifi Sonlandır Butonu ── */}
        {isCookingActive && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFinishModalVisible(true)}
            style={{
              backgroundColor: '#10B981',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginTop: 10,
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
              Tarifi Sonlandır
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Afiyet Olsun Modalı ── */}
      <Modal visible={isFinishModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.4)',
            }}
          >
            {/* Kutlama İkonu */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 32 }}>🎉</Text>
            </View>

            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 22,
                fontWeight: '800',
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              Afiyet Olsun!
            </Text>

            <Text
              style={{
                color: '#94A3B8',
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Tarifi harika bir şekilde tamamladınız. Eline sağlık!
            </Text>

            {/* Buton 1: Makro Sayacıma Ekle (Şimdilik eylemsiz) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert('Bilgi', 'Makro sayacına ekleme özelliği yakında aktif olacaktır.');
              }}
              style={{
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                borderWidth: 1,
                borderColor: '#FF6B35',
                width: '100%',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#FF6B35', fontSize: 15, fontWeight: '700' }}>
                Makro Sayacıma Ekle
              </Text>
            </TouchableOpacity>

            {/* Buton 2: Kapat / Ana Sayfaya Dön */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setIsFinishModalVisible(false);
                setIsCookingActive(false);
                router.replace('/(tabs)');
              }}
              style={{
                backgroundColor: '#10B981',
                width: '100%',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
                Kapat (Ana Sayfaya Dön)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
