import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Alert,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useImagePicker, ImagePickerResult } from "@/hooks/useImagePicker";
import { useRecipeFlow } from "@/hooks/useRecipeFlow";
import { BASE_URL, ENDPOINTS } from "@/constants/ApiConfig";

// ─────────── Öğün Seçenekleri ───────────
const MEAL_OPTIONS = [
  { key: 'kahvalti', label: 'Kahvaltı', icon: '🌅' },
  { key: 'ogle', label: 'Öğle', icon: '☀️' },
  { key: 'aksam', label: 'Akşam', icon: '🌙' },
  { key: 'ara_ogun', label: 'Ara Öğün', icon: '🍎' },
] as const;

type MealKey = (typeof MEAL_OPTIONS)[number]['key'];

export default function TabScannerScreen() {
  const { pickImage, loading } = useImagePicker();
  const { setMacroResponse } = useRecipeFlow();
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealKey | null>(null);
  const [mealDropdownVisible, setMealDropdownVisible] = useState(false);
  const router = useRouter();

  // Pulse animation for loading text
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isAnalyzing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isAnalyzing]);

  const handleAction = async (actionType: string, source: 'camera' | 'gallery') => {
    setCurrentAction(actionType);
    const result = await pickImage(source);
    if (result && result.uri) {
      setSelectedImage(result);
      // Macro seçim durumunu sıfırla
      if (actionType === 'MACRO_CALC') {
        setSelectedMeal(null);
      }
    } else {
      setCurrentAction(null);
    }
  };

  const promptImageSource = (actionType: string) => {
    Alert.alert(
      "Görüntü Kaynağı",
      "Lütfen bir seçenek belirleyin:",
      [
        { text: "İptal", style: "cancel" },
        { text: "Kamera", onPress: () => handleAction(actionType, 'camera') },
        { text: "Galeri", onPress: () => handleAction(actionType, 'gallery') },
      ],
      { cancelable: true }
    );
  };

  const confirmImage = async () => {
    if (!selectedImage?.base64) {
      closeModal();
      return;
    }

    if (currentAction === 'AI_RECIPE') {
      // Close preview modal and show loading screen
      const imageBase64 = selectedImage.base64;
      setSelectedImage(null);
      setIsAnalyzing(true);

      try {
        console.log('[AI_RECIPE] API isteği gönderiliyor:', `${BASE_URL}${ENDPOINTS.malzemeTani}`);
        const response = await fetch(`${BASE_URL}${ENDPOINTS.malzemeTani}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageBase64,
          }),
        });

        const data = await response.json();
        console.log('[AI_RECIPE] /malzeme-tani yanıtı:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          console.error('[AI_RECIPE] API hatası, status:', response.status, data);
          Alert.alert('API Hatası', `Sunucu hatası: ${response.status}`);
          setIsAnalyzing(false);
          setCurrentAction(null);
          return;
        }

        // Navigate to ingredient edit screen with the data
        setIsAnalyzing(false);
        setCurrentAction(null);
        router.push({
          pathname: '/scanner/ingredient-edit',
          params: {
            ingredients: JSON.stringify(data.malzemeler || []),
          },
        });
      } catch (error) {
        console.error('[AI_RECIPE] Fetch hatası:', error);
        Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
        setIsAnalyzing(false);
        setCurrentAction(null);
      }
    } else if (currentAction === 'MACRO_CALC') {
      if (!selectedMeal) {
        Alert.alert('Öğün Seçin', 'Lütfen devam etmeden önce bir öğün seçin.');
        return;
      }

      const imageBase64 = selectedImage.base64;
      const meal = selectedMeal;
      setSelectedImage(null);
      setIsAnalyzing(true);

      try {
        console.log('[MACRO_CALC] API isteği gönderiliyor:', `${BASE_URL}${ENDPOINTS.macroHesapla}`);
        const response = await fetch(`${BASE_URL}${ENDPOINTS.macroHesapla}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aciklama: imageBase64,
            ogun: meal,
          }),
        });

        const data = await response.json();
        console.log('[MACRO_CALC] /macro-hesapla yanıtı:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          console.error('[MACRO_CALC] API hatası, status:', response.status, data);
          Alert.alert('API Hatası', `Sunucu hatası: ${response.status}`);
          setIsAnalyzing(false);
          setCurrentAction(null);
          return;
        }
        /*
        // Save to context and navigate to results screen
        setMacroResponse(data);
        setIsAnalyzing(false);
        setCurrentAction(null);
        router.push('/scanner/macro-results');
        */
      } catch (error) {
        console.error('[MACRO_CALC] Fetch hatası:', error);
        Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
        setIsAnalyzing(false);
        setCurrentAction(null);
      }
    } else {
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
    setCurrentAction(null);
    setSelectedMeal(null);
  };

  const retakeImage = async () => {
    if (currentAction) {
      const action = currentAction;
      closeModal();
      promptImageSource(action);
    }
  };

  // ─────── Loading / Analyzing Screen ───────
  if (isAnalyzing) {
    const isMacro = currentAction === 'MACRO_CALC';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
        <StatusBar barStyle="light-content" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          {/* Animation Container */}
          <View
            style={{
              width: 260,
              height: 260,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 130,
              backgroundColor: isMacro
                ? "rgba(16, 185, 129, 0.04)"
                : "rgba(255, 107, 53, 0.04)",
              overflow: "hidden",
            }}
          >
            <LottieView
              source={
                isMacro
                  ? require("@/assets/animations/calculatingAnimation.json")
                  : require("@/assets/animations/ImageScanningAnimation.json")
              }
              autoPlay
              loop
              style={{ width: "85%", height: "85%" }}
              resizeMode="contain"
            />
          </View>

          {/* Animated Text */}
          <Animated.Text
            style={{
              color: "#F1F5F9",
              fontSize: 20,
              fontWeight: "700",
              marginTop: 36,
              letterSpacing: -0.3,
              opacity: pulseAnim,
            }}
          >
            {isMacro ? "Besin değerleri hesaplanıyor..." : "Resminiz analiz ediliyor..."}
          </Animated.Text>

          <Text
            style={{
              color: "#64748B",
              fontSize: 14,
              fontWeight: "500",
              marginTop: 10,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {isMacro
              ? "AI, yemeğinizin makro değerlerini\nhesaplıyor"
              : "AI, buzdolabınızdaki malzemeleri\ntanımlıyor"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────── Öğün seçimi dropdown label ───────
  const selectedMealLabel = selectedMeal
    ? MEAL_OPTIONS.find((m) => m.key === selectedMeal)
    : null;

  // ─────── Main Scanner Screen ───────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar barStyle="light-content" />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
          gap: 16,
        }}
      >
        {/* AI ile Yemek Tarifi Üret Butonu */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => promptImageSource('AI_RECIPE')}
          disabled={loading}
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(30, 41, 59, 1)",
            borderRadius: 20,
            paddingVertical: 22,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: "rgba(255, 107, 53, 0.25)",
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {/* İkon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(255, 107, 53, 0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}>
            <Ionicons name="sparkles" size={28} color="#FF6B35" />
          </View>

          {/* Metin */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#F1F5F9",
                fontSize: 17,
                fontWeight: "800",
                letterSpacing: -0.3,
                marginBottom: 4,
              }}
            >
              AI ile Yemek Tarifi Üret
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 17,
              }}
            >
              Buzdolabındaki malzemelerle yemek tarifi oluştur
            </Text>
          </View>

          {/* Sağ Ok */}
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>

        {/* Macro Hesaplama Butonu */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => promptImageSource('MACRO_CALC')}
          disabled={loading}
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(30, 41, 59, 1)",
            borderRadius: 20,
            paddingVertical: 22,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: "rgba(16, 185, 129, 0.25)",
            shadowColor: "#10B981",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {/* İkon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <Ionicons name="nutrition" size={28} color="#10B981" />
          </View>

          {/* Metin */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#F1F5F9",
                fontSize: 17,
                fontWeight: "800",
                letterSpacing: -0.3,
                marginBottom: 4,
              }}
            >
              Macro Hesaplama
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 17,
                paddingRight: 10,
              }}>
              Yemeğin besin değerlerini ve kalorilerini hesapla
            </Text>
          </View>

          {/* Sağ Ok */}
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Resim Önizleme Modalı */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)' }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
              Fotoğraf Önizleme
            </Text>

            <View style={{
              backgroundColor: '#1E293B',
              borderRadius: 20,
              overflow: 'hidden',
              aspectRatio: 3 / 4,
              width: '100%',
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.5)'
            }}>
              {selectedImage?.uri && (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* ─── Öğün Seçimi (sadece MACRO_CALC için) ─── */}
            {currentAction === 'MACRO_CALC' && (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: '#94A3B8',
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    marginBottom: 10,
                    marginLeft: 4,
                  }}
                >
                  Öğün Seçin
                </Text>

                {/* Dropdown trigger */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setMealDropdownVisible(true)}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: selectedMeal
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'rgba(71, 85, 105, 0.4)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 18 }}>
                      {selectedMealLabel ? selectedMealLabel.icon : '🍽️'}
                    </Text>
                    <Text
                      style={{
                        color: selectedMeal ? '#F1F5F9' : '#64748B',
                        fontSize: 15,
                        fontWeight: selectedMeal ? '700' : '500',
                      }}
                    >
                      {selectedMealLabel ? selectedMealLabel.label : 'Öğün seçin...'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            {/* Butonlar */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity
                onPress={retakeImage}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(71, 85, 105, 0.5)',
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Ionicons name="camera-reverse" size={20} color="#F1F5F9" />
                <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700' }}>Tekrar Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmImage}
                disabled={currentAction === 'MACRO_CALC' && !selectedMeal}
                style={{
                  flex: 1,
                  backgroundColor:
                    currentAction === 'MACRO_CALC'
                      ? (selectedMeal ? '#10B981' : 'rgba(16, 185, 129, 0.4)')
                      : '#FF6B35',
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: currentAction === 'MACRO_CALC' && !selectedMeal ? 0.6 : 1,
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Kullan</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={closeModal}
              style={{ marginTop: 20, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '600' }}>İptal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Öğün Seçimi Dropdown Modal ─── */}
      <Modal
        visible={mealDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMealDropdownVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMealDropdownVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#1E293B',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 36,
              paddingTop: 8,
              borderTopWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.3)',
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: 'rgba(71, 85, 105, 0.5)',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 16,
                fontWeight: '800',
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              Öğün Seçin
            </Text>
            {MEAL_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  setSelectedMeal(opt.key);
                  setMealDropdownVisible(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: 'rgba(71, 85, 105, 0.2)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                  <Text
                    style={{
                      color: opt.key === selectedMeal ? '#10B981' : '#F1F5F9',
                      fontSize: 15,
                      fontWeight: opt.key === selectedMeal ? '700' : '500',
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
                {opt.key === selectedMeal && (
                  <Ionicons name="checkmark" size={18} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
