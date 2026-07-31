import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  Image,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useImagePicker, ImagePickerResult } from '@/hooks/useImagePicker';
import { useFridge } from '@/hooks/useFridge';
import { BASE_URL, ENDPOINTS } from '@/constants/ApiConfig';
import {
  Ingredient,
  BirimOption,
  BIRIM_LABELS,
  parseMiktar,
  generateIngredientId,
} from '@/utils/ingredientUtils';
import IngredientEditCard from '@/components/IngredientEditCard';
import BirimDropdownModal from '@/components/BirimDropdownModal';

// ─────────── Tooltip Bileşeni ───────────
function FridgeItemChip({
  item,
  isTooltipVisible,
  onPress,
}: {
  item: Ingredient;
  isTooltipVisible: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ position: 'relative', margin: 4 }}>
      {/* Tooltip */}
      {isTooltipVisible && (
        <View
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: [{ translateX: -50 }],
            marginBottom: 6,
            backgroundColor: '#334155',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            zIndex: 999,
            minWidth: 80,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#F1F5F9', fontSize: 12, fontWeight: '600' }}>
            {item.miktar} {item.birim}
          </Text>
          {/* Tooltip arrow */}
          <View
            style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              transform: [{ translateX: -5 }],
              width: 0,
              height: 0,
              borderLeftWidth: 5,
              borderRightWidth: 5,
              borderTopWidth: 5,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#334155',
            }}
          />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: isTooltipVisible
            ? 'rgba(255, 107, 53, 0.4)'
            : 'rgba(71, 85, 105, 0.3)',
        }}
      >
        <Text
          style={{
            color: isTooltipVisible ? '#FF6B35' : '#E2E8F0',
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'capitalize',
          }}
        >
          {item.ad}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────── Ana Ekran ───────────
export default function FridgeScreen() {
  const router = useRouter();
  const { pickImage, loading: pickLoading } = useImagePicker();
  const {
    items: fridgeItems,
    loading: fridgeLoading,
    updateItems,
    addItem,
    removeItem,
    replaceAll,
  } = useFridge();

  // ── State'ler ──
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [syncIngredients, setSyncIngredients] = useState<Ingredient[] | null>(null);
  const [dropdownIngredientId, setDropdownIngredientId] = useState<string | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  // Manuel ekleme
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMiktar, setNewMiktar] = useState('');
  const [newBirim, setNewBirim] = useState<BirimOption>('adet');
  const [showNewBirimPicker, setShowNewBirimPicker] = useState(false);

  // Pulse animation
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

  // Tooltip 2sn sonra kapanır
  useEffect(() => {
    if (tooltipId) {
      const timer = setTimeout(() => setTooltipId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [tooltipId]);

  // ── Senkronizasyon listesinden seçili ingredient (birim dropdown için) ──
  const selectedDropdownIngredient = syncIngredients?.find(
    (i) => i.id === dropdownIngredientId
  );

  // Buzdolabı bölmeleri — rastgele dağılım
  const { topItems, bottomItems } = useMemo(() => {
    const top: Ingredient[] = [];
    const bottom: Ingredient[] = [];
    fridgeItems.forEach((item, idx) => {
      if (idx % 2 === 0) top.push(item);
      else bottom.push(item);
    });
    return { topItems: top, bottomItems: bottom };
  }, [fridgeItems]);

  // ── Aksiyon Fonksiyonları ──

  const promptImageSource = () => {
    Alert.alert(
      'Görüntü Kaynağı',
      'Lütfen bir seçenek belirleyin:',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Kamera', onPress: () => handleImagePick('camera') },
        { text: 'Galeri', onPress: () => handleImagePick('gallery') },
      ],
      { cancelable: true }
    );
  };

  const handleImagePick = async (source: 'camera' | 'gallery') => {
    const result = await pickImage(source);
    if (result && result.uri) {
      setSelectedImage(result);
    }
  };

  const closePreview = () => {
    setSelectedImage(null);
  };

  const retakeImage = () => {
    closePreview();
    promptImageSource();
  };

  const confirmImage = async () => {
    if (!selectedImage?.base64) {
      closePreview();
      return;
    }

    setSelectedImage(null);
    setIsAnalyzing(true);

    try {
      console.log('[FRIDGE] API isteği gönderiliyor:', `${BASE_URL}${ENDPOINTS.malzemeTani}`);
      const response = await fetch(`${BASE_URL}${ENDPOINTS.malzemeTani}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage.base64 }),
      });

      const data = await response.json();
      console.log('[FRIDGE] /malzeme-tani yanıtı:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('[FRIDGE] API hatası, status:', response.status, data);
        Alert.alert('API Hatası', `Sunucu hatası: ${response.status}`);
        setIsAnalyzing(false);
        return;
      }

      // API yanıtını parse et
      const rawList = (data.malzemeler || []) as Array<{ ad: string; miktar: string }>;
      const parsed = rawList.map((item, index) => {
        const p = parseMiktar(item.miktar);
        return {
          id: generateIngredientId('sync'),
          ad: item.ad,
          miktar: p.miktar,
          birim: p.birim,
        } as Ingredient;
      });

      setIsAnalyzing(false);
      setSyncIngredients(parsed);
    } catch (error) {
      console.error('[FRIDGE] Fetch hatası:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
      setIsAnalyzing(false);
    }
  };

  // Senkronizasyon listesi handler'ları
  const handleSyncMiktarChange = (id: string, value: string) => {
    setSyncIngredients((prev) =>
      prev ? prev.map((item) => (item.id === id ? { ...item, miktar: value } : item)) : prev
    );
  };

  const handleSyncBirimChange = (birim: BirimOption) => {
    if (!dropdownIngredientId) return;
    setSyncIngredients((prev) =>
      prev
        ? prev.map((item) =>
            item.id === dropdownIngredientId ? { ...item, birim } : item
          )
        : prev
    );
  };

  const handleSyncDelete = (id: string) => {
    setSyncIngredients((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
  };

  // Ürün ekle (senkronizasyon listesine)
  const handleAddToSyncList = () => {
    if (!newName.trim()) {
      Alert.alert('Hata', 'Ürün adı boş olamaz.');
      return;
    }
    const newItem: Ingredient = {
      id: generateIngredientId('manual'),
      ad: newName.trim(),
      miktar: newMiktar || '1',
      birim: newBirim,
    };
    setSyncIngredients((prev) => (prev ? [...prev, newItem] : [newItem]));
    setNewName('');
    setNewMiktar('');
    setNewBirim('adet');
    setShowAddForm(false);
  };

  // Buzdolabına kaydet
  const handleSaveToFridge = async () => {
    if (!syncIngredients || syncIngredients.length === 0) return;

    const hasAnyError = syncIngredients.some((item) => {
      const val = parseFloat(item.miktar);
      return item.miktar.trim() === '' || isNaN(val) || val <= 0;
    });
    if (hasAnyError) {
      Alert.alert('Hata', 'Lütfen tüm miktarları kontrol edin.');
      return;
    }

    await updateItems(syncIngredients);
    setSyncIngredients(null);
    Alert.alert('Başarılı', 'Buzdolabınız güncellendi!');
  };

  // Manuel ürün ekle (direkt buzdolabına)
  const handleAddDirectly = () => {
    if (!newName.trim()) {
      Alert.alert('Hata', 'Ürün adı boş olamaz.');
      return;
    }
    addItem({
      ad: newName.trim(),
      miktar: newMiktar || '1',
      birim: newBirim,
    });
    setNewName('');
    setNewMiktar('');
    setNewBirim('adet');
    setShowAddForm(false);
  };

  // ─────────── Loading / Analyzing Screen ───────────
  if (isAnalyzing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <StatusBar barStyle="light-content" />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 260,
              height: 260,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 130,
              backgroundColor: 'rgba(255, 107, 53, 0.04)',
              overflow: 'hidden',
            }}
          >
            <LottieView
              source={require('@/assets/animations/ImageScanningAnimation.json')}
              autoPlay
              loop
              style={{ width: '85%', height: '85%' }}
              resizeMode="contain"
            />
          </View>

          <Animated.Text
            style={{
              color: '#F1F5F9',
              fontSize: 20,
              fontWeight: '700',
              marginTop: 36,
              letterSpacing: -0.3,
              opacity: pulseAnim,
            }}
          >
            Buzdolabınız analiz ediliyor...
          </Animated.Text>

          <Text
            style={{
              color: '#64748B',
              fontSize: 14,
              fontWeight: '500',
              marginTop: 10,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            AI, buzdolabınızdaki malzemeleri{'\n'}tanımlıyor
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────── Senkronizasyon Sonuç Ekranı ───────────
  if (syncIngredients !== null) {
    const hasAnyError = syncIngredients.some((item) => {
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
          {/* Header Info */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
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
              <Ionicons name="snow-outline" size={18} color="#FF6B35" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700' }}>
                  Buzdolabı Analiz Sonucu
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                  {syncIngredients.length} malzeme tespit edildi — miktarları düzenleyebilirsiniz
                </Text>
              </View>
            </View>
          </View>

          {/* Malzeme Listesi */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {syncIngredients.map((item) => (
              <IngredientEditCard
                key={item.id}
                ingredient={item}
                onMiktarChange={handleSyncMiktarChange}
                onBirimPress={(id) => setDropdownIngredientId(id)}
                onDelete={handleSyncDelete}
              />
            ))}

            {syncIngredients.length === 0 && (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                <Ionicons name="alert-circle-outline" size={48} color="#475569" />
                <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '600', marginTop: 12 }}>
                  Malzeme bulunamadı
                </Text>
              </View>
            )}

            {/* ── Ürün Ekle Butonu ── */}
            {!showAddForm ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAddForm(true)}
                style={{
                  marginTop: 6,
                  backgroundColor: 'rgba(255, 107, 53, 0.08)',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 107, 53, 0.2)',
                  borderStyle: 'dashed',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
                <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '700' }}>
                  Ürün Ekle
                </Text>
              </TouchableOpacity>
            ) : (
              <AddItemForm
                name={newName}
                miktar={newMiktar}
                birim={newBirim}
                onNameChange={setNewName}
                onMiktarChange={setNewMiktar}
                onBirimPress={() => setShowNewBirimPicker(true)}
                onAdd={handleAddToSyncList}
                onCancel={() => { setShowAddForm(false); setNewName(''); setNewMiktar(''); setNewBirim('adet'); }}
              />
            )}
          </ScrollView>

          {/* Alt Butonlar */}
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
            <TouchableOpacity
              onPress={handleSaveToFridge}
              activeOpacity={0.8}
              style={{
                backgroundColor: hasAnyError ? 'rgba(255, 107, 53, 0.4)' : '#FF6B35',
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
                Buzdolabıma Kaydet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSyncIngredients(null)}
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
              <Text style={{ color: '#94A3B8', fontSize: 15, fontWeight: '600' }}>
                İptal Et
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Birim Dropdown — senkronizasyon listesi */}
        <BirimDropdownModal
          visible={!!dropdownIngredientId}
          selected={(selectedDropdownIngredient?.birim as BirimOption) || 'adet'}
          onSelect={handleSyncBirimChange}
          onClose={() => setDropdownIngredientId(null)}
        />

        {/* Birim Dropdown — yeni ürün ekle */}
        <BirimDropdownModal
          visible={showNewBirimPicker}
          selected={newBirim}
          onSelect={(v) => setNewBirim(v)}
          onClose={() => setShowNewBirimPicker(false)}
        />
      </SafeAreaView>
    );
  }

  // ─────────── Ana Buzdolabım Ekranı ───────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
      >
        {/* ── Senkronize Et Butonu ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={promptImageSource}
            disabled={pickLoading}
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(30, 41, 59, 1)',
              borderRadius: 20,
              paddingVertical: 22,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 53, 0.25)',
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 107, 53, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Text style={{ fontSize: 28 }}>📷</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#F1F5F9',
                  fontSize: 17,
                  fontWeight: '800',
                  letterSpacing: -0.3,
                  marginBottom: 4,
                }}
              >
                Buzdolabımı Senkronize Et
              </Text>
              <Text
                style={{
                  color: '#94A3B8',
                  fontSize: 12,
                  fontWeight: '500',
                  lineHeight: 17,
                }}
              >
                Buzdolabının fotoğrafını çek, AI malzemeleri tanısın
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* ── Buzdolabı Görünümü ── */}
        {fridgeItems.length > 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            {/* Bölüm başlığı */}
            <Text
              style={{
                color: '#475569',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
                marginLeft: 4,
              }}
            >
              Buzdolabındakiler
            </Text>

            {/* Buzdolabı kasası */}
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 24,
                borderWidth: 2,
                borderColor: 'rgba(71, 85, 105, 0.4)',
                overflow: 'hidden',
              }}
            >
              {/* Üst kısım — kulp */}
              <View
                style={{
                  alignItems: 'flex-end',
                  paddingRight: 16,
                  paddingTop: 10,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 40,
                    backgroundColor: 'rgba(148, 163, 184, 0.4)',
                    borderRadius: 3,
                  }}
                />
              </View>

              {/* Üst bölme */}
              <View
                style={{
                  marginHorizontal: 12,
                  marginTop: 4,
                  backgroundColor: '#F1EFE7',
                  borderRadius: 16,
                  padding: 14,
                  minHeight: 80,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                  }}
                >
                  {topItems.map((item) => (
                    <FridgeItemChip
                      key={item.id}
                      item={item}
                      isTooltipVisible={tooltipId === item.id}
                      onPress={() =>
                        setTooltipId((prev) => (prev === item.id ? null : item.id))
                      }
                    />
                  ))}
                </View>
                {topItems.length === 0 && (
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', textAlign: 'center', paddingVertical: 12 }}>
                    Üst bölme boş
                  </Text>
                )}
              </View>

              {/* Ayırıcı çizgi */}
              <View
                style={{
                  height: 2,
                  backgroundColor: 'rgba(71, 85, 105, 0.3)',
                  marginHorizontal: 12,
                  marginVertical: 8,
                }}
              />

              {/* Alt bölme */}
              <View
                style={{
                  marginHorizontal: 12,
                  marginBottom: 12,
                  backgroundColor: '#EAE9DF',
                  borderRadius: 16,
                  padding: 14,
                  minHeight: 80,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                  }}
                >
                  {bottomItems.map((item) => (
                    <FridgeItemChip
                      key={item.id}
                      item={item}
                      isTooltipVisible={tooltipId === item.id}
                      onPress={() =>
                        setTooltipId((prev) => (prev === item.id ? null : item.id))
                      }
                    />
                  ))}
                </View>
                {bottomItems.length === 0 && (
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', textAlign: 'center', paddingVertical: 12 }}>
                    Alt bölme boş
                  </Text>
                )}
              </View>

              {/* Alt kulp */}
              <View
                style={{
                  alignItems: 'flex-end',
                  paddingRight: 16,
                  paddingBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 30,
                    backgroundColor: 'rgba(148, 163, 184, 0.4)',
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>

            {/* ── Ürün bilgisi ── */}
            <View
              style={{
                marginTop: 12,
                backgroundColor: 'rgba(255, 107, 53, 0.06)',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 107, 53, 0.12)',
              }}
            >
              <Ionicons name="information-circle-outline" size={16} color="#FF6B35" />
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', flex: 1 }}>
                Malzemelere dokunarak miktar ve birim bilgisini görebilirsiniz
              </Text>
            </View>

            {/* ── Direkt Ürün Ekle ── */}
            {!showAddForm ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAddForm(true)}
                style={{
                  marginTop: 16,
                  backgroundColor: 'rgba(255, 107, 53, 0.08)',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 107, 53, 0.2)',
                  borderStyle: 'dashed',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
                <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '700' }}>
                  Ürün Ekle
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: 16 }}>
                <AddItemForm
                  name={newName}
                  miktar={newMiktar}
                  birim={newBirim}
                  onNameChange={setNewName}
                  onMiktarChange={setNewMiktar}
                  onBirimPress={() => setShowNewBirimPicker(true)}
                  onAdd={handleAddDirectly}
                  onCancel={() => { setShowAddForm(false); setNewName(''); setNewMiktar(''); setNewBirim('adet'); }}
                />
              </View>
            )}
          </View>
        ) : (
          /* Boş buzdolabı */
          <View style={{ paddingHorizontal: 16, alignItems: 'center', paddingTop: 40 }}>
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 24,
                borderWidth: 2,
                borderColor: 'rgba(71, 85, 105, 0.4)',
                paddingVertical: 50,
                paddingHorizontal: 30,
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text style={{ fontSize: 56, marginBottom: 16 }}>🧊</Text>
              <Text
                style={{
                  color: '#64748B',
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                Buzdolabınız boş
              </Text>
              <Text
                style={{
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: '500',
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 19,
                }}
              >
                Yukarıdaki butona basarak buzdolabınızın{'\n'}fotoğrafını çekin
              </Text>
            </View>

            {/* ── Direkt Ürün Ekle (boş durum) ── */}
            {!showAddForm ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAddForm(true)}
                style={{
                  marginTop: 20,
                  backgroundColor: 'rgba(255, 107, 53, 0.08)',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 107, 53, 0.2)',
                  borderStyle: 'dashed',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
                <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '700' }}>
                  Manuel Ürün Ekle
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: 20, width: '100%' }}>
                <AddItemForm
                  name={newName}
                  miktar={newMiktar}
                  birim={newBirim}
                  onNameChange={setNewName}
                  onMiktarChange={setNewMiktar}
                  onBirimPress={() => setShowNewBirimPicker(true)}
                  onAdd={handleAddDirectly}
                  onCancel={() => { setShowAddForm(false); setNewName(''); setNewMiktar(''); setNewBirim('adet'); }}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Resim Önizleme Modalı ── */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="slide"
        onRequestClose={closePreview}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
            Fotoğraf Önizleme
          </Text>

          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 20,
              overflow: 'hidden',
              aspectRatio: 3 / 4,
              width: '100%',
              marginBottom: 30,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.5)',
            }}
          >
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
                gap: 8,
              }}
            >
              <Ionicons name="camera-reverse" size={20} color="#F1F5F9" />
              <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700' }}>Tekrar Çek</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmImage}
              style={{
                flex: 1,
                backgroundColor: '#FF6B35',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Kullan</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={closePreview}
            style={{ marginTop: 20, alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '600' }}>İptal</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Birim Dropdown — yeni ürün ekle (ana ekranda) */}
      <BirimDropdownModal
        visible={showNewBirimPicker}
        selected={newBirim}
        onSelect={(v) => setNewBirim(v)}
        onClose={() => setShowNewBirimPicker(false)}
      />
    </SafeAreaView>
  );
}

// ─────────── Ürün Ekleme Formu ───────────
function AddItemForm({
  name,
  miktar,
  birim,
  onNameChange,
  onMiktarChange,
  onBirimPress,
  onAdd,
  onCancel,
}: {
  name: string;
  miktar: string;
  birim: BirimOption;
  onNameChange: (v: string) => void;
  onMiktarChange: (v: string) => void;
  onBirimPress: () => void;
  onAdd: () => void;
  onCancel: () => void;
}) {

  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.25)',
      }}
    >
      <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
        Yeni Ürün Ekle
      </Text>

      {/* İsim */}
      <View
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(71, 85, 105, 0.4)',
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 10,
        }}
      >
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="Ürün adı"
          placeholderTextColor="#475569"
          style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '600', padding: 0 }}
        />
      </View>

      {/* Miktar + Birim */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.4)',
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <TextInput
            value={miktar}
            onChangeText={onMiktarChange}
            placeholder="Miktar"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '600', padding: 0, textAlign: 'center' }}
          />
        </View>

        <TouchableOpacity
          onPress={onBirimPress}
          activeOpacity={0.7}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.4)',
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            {BIRIM_LABELS[birim] || birim}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Butonlar */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: 'rgba(100, 116, 139, 0.15)',
          }}
        >
          <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 14 }}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAdd}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: '#FF6B35',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Ekle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
