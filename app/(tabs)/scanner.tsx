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
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useImagePicker, ImagePickerResult } from "@/hooks/useImagePicker";
import { BASE_URL, ENDPOINTS } from "@/constants/ApiConfig";

export default function TabScannerScreen() {
  const { pickImage, loading } = useImagePicker();
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
            image: selectedImage.base64,
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
    } else {
      // MACRO_CALC veya diğer modlar — henüz sadece log
      console.log(`[${currentAction}] Onaylanan resim base64 (ilk 100 karakter):`, selectedImage.base64.substring(0, 100) + '...');
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
    setCurrentAction(null);
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
              backgroundColor: "rgba(255, 107, 53, 0.04)",
              overflow: "hidden",
            }}
          >
            <LottieView
              source={require("@/assets/animations/ImageScanningAnimation.json")}
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
            Resminiz analiz ediliyor...
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
            AI, buzdolabınızdaki malzemeleri{"\n"}tanımlıyor
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
            Fotoğraf Önizleme
          </Text>

          <View style={{
            backgroundColor: '#1E293B',
            borderRadius: 20,
            overflow: 'hidden',
            aspectRatio: 3 / 4,
            width: '100%',
            marginBottom: 30,
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
              style={{
                flex: 1,
                backgroundColor: currentAction === 'AI_RECIPE' ? '#FF6B35' : '#10B981',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}
