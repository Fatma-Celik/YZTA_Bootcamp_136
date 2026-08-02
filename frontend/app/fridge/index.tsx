import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Animated,
  Easing,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useImagePicker, ImagePickerResult } from '@/hooks/useImagePicker';
import { useFridge } from '@/hooks/useFridge';
import { useAlert } from '@/contexts/AlertContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAllergens } from '@/hooks/useAllergens';
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
  const { colors } = useTheme();

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
            backgroundColor: colors.card,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            zIndex: 999,
            minWidth: 80,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.cardBorder,
            shadowColor: colors.cardBorder,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
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
              borderTopColor: colors.cardBorder,
            }}
          />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={{
          backgroundColor: isTooltipVisible ? 'rgba(255, 107, 53, 0.15)' : colors.card,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: isTooltipVisible ? colors.primary : colors.cardBorder,
        }}
      >
        <Text
          style={{
            color: isTooltipVisible ? colors.primary : colors.textPrimary,
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
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { allergens } = useAllergens();
  const {
    items: fridgeItems = [],
    loading: fridgeLoading,
    updateItems,
    addItem,
    removeItem,
    replaceAll,
  } = useFridge();

  // ── State'ler ──
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const [syncIngredients, setSyncIngredients] = useState<Ingredient[] | null>(null);
  const [dropdownIngredientId, setDropdownIngredientId] = useState<string | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  // Market listesi tercih modalı state'leri
  const [showMarketOptionsModal, setShowMarketOptionsModal] = useState(false);
  const [marketKisiSayisi, setMarketKisiSayisi] = useState('2');
  const [marketSureDakika, setMarketSureDakika] = useState('30');
  const [marketDiyet, setMarketDiyet] = useState('normal');
  const [marketHedef, setMarketHedef] = useState('kilo_verme');
  const [marketOgun, setMarketOgun] = useState('kahvaltı');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  // Kullanıcı alerjenlerini varsayılan seçili hale getir
  useEffect(() => {
    if (allergens && allergens.length > 0) {
      setSelectedAllergens(allergens.map((a) => a.allergen_name));
    }
  }, [allergens]);

  // AI Market Listesi Oluşturma Handler (Dinamik Kullanıcı Seçimleriyle)
  const handleGenerateMarketList = async () => {
    if (!fridgeItems || fridgeItems.length === 0) return;
    setIsMarketLoading(true);

    const malzemelerFormatted = fridgeItems.map(
      (item) => `${item.ad}${item.miktar ? ' ' + item.miktar : ''}${item.birim ? ' ' + item.birim : ''}`.trim()
    );

    const body = {
      malzemeler: malzemelerFormatted,
      kisi_sayisi: parseInt(marketKisiSayisi, 10) || 2,
      sure_dakika: parseInt(marketSureDakika, 10) || 30,
      diyet: marketDiyet,
      hedef: marketHedef,
      ogun: marketOgun,
      alerjenler: selectedAllergens,
      kullanici_id: user?.id || 'test_user_vision',
    };

    console.log('[MarketListesi] Gönderilen Body:', JSON.stringify(body, null, 2));

    try {
      const response = await fetch(`${BASE_URL}${ENDPOINTS.marketListesi}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('[MarketListesi] Yanıt:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        showAlert({
          title: 'Hata',
          message: 'Market listesi oluşturulurken bir hata oluştu.',
          type: 'error',
        });
        return;
      }

      if (data.eksik_malzemeler) {
        setShowMarketOptionsModal(false);
        router.push({
          pathname: '/scanner/ingredient-edit',
          params: {
            missingList: JSON.stringify(data.eksik_malzemeler),
            isMarketList: 'true',
            kaynak: 'gemini',
          },
        });
      } else {
        showAlert({
          title: 'Hata',
          message: 'Market listesi verisi alınamadı.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('[MarketListesi] Fetch hatası:', error);
      showAlert({
        title: 'Bağlantı Hatası',
        message: 'Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol edin.',
        type: 'error',
      });
    } finally {
      setIsMarketLoading(false);
    }
  };

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
    (fridgeItems || []).forEach((item, idx) => {
      if (idx % 2 === 0) top.push(item);
      else bottom.push(item);
    });
    return { topItems: top, bottomItems: bottom };
  }, [fridgeItems]);

  // ── Aksiyon Fonksiyonları ──

  const promptImageSource = () => {
    showAlert({
      title: 'Görüntü Kaynağı',
      message: 'Lütfen bir seçenek belirleyin:',
      type: 'confirm',
      confirmText: 'Kamera',
      cancelText: 'Galeri',
      onConfirm: () => handleImagePick('camera'),
      onCancel: () => handleImagePick('gallery'),
    });
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
        showAlert({ title: 'API Hatası', message: `Sunucu hatası: ${response.status}`, type: 'error' });
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
      showAlert({ title: 'Bağlantı Hatası', message: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.', type: 'error' });
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
      showAlert({ title: 'Hata', message: 'Ürün adı boş olamaz.', type: 'warning' });
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
      showAlert({ title: 'Hata', message: 'Lütfen tüm miktarları kontrol edin.', type: 'warning' });
      return;
    }

    await updateItems(syncIngredients);
    setSyncIngredients(null);
    showAlert({ title: 'Başarılı', message: 'Buzdolabınız güncellendi!', type: 'success' });
  };

  // Manuel ürün ekle (direkt buzdolabına)
  const handleAddDirectly = () => {
    if (!newName.trim()) {
      showAlert({ title: 'Hata', message: 'Ürün adı boş olamaz.', type: 'warning' });
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={colors.statusBar} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Animated.View style={{ opacity: pulseAnim }}>
            <Ionicons name="scan-circle-outline" size={80} color={colors.primary} />
          </Animated.View>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 24, textAlign: 'center' }}>
            Buzdolabınız Analiz Ediliyor
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
            Görsel işleniyor ve içindeki malzemeler tespit ediliyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────── Senkronizasyon Onay Ekranı ───────────
  if (syncIngredients !== null) {
    const hasAnyError = syncIngredients.some((item) => {
      const val = parseFloat(item.miktar);
      return item.miktar.trim() === '' || isNaN(val) || val <= 0;
    });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={colors.statusBar} />

        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
          >
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>
                Tespit Edilen Malzemeler
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                Miktarları düzenleyebilir veya eksik ürün ekleyebilirsiniz.
              </Text>
            </View>

            {syncIngredients.map((item) => (
              <IngredientEditCard
                key={item.id}
                ingredient={item}
                onMiktarChange={handleSyncMiktarChange}
                onBirimPress={setDropdownIngredientId}
                onDelete={handleSyncDelete}
              />
            ))}

            {!showAddForm ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAddForm(true)}
                style={{
                  marginTop: 12,
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
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
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
              borderTopColor: colors.divider,
              backgroundColor: colors.background,
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={handleSaveToFridge}
              activeOpacity={0.8}
              style={{
                backgroundColor: hasAnyError ? 'rgba(255, 107, 53, 0.4)' : colors.primary,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                shadowColor: colors.primary,
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
                backgroundColor: colors.card,
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: '600' }}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <StatusBar barStyle={colors.statusBar} />

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
              backgroundColor: colors.card,
              borderRadius: 20,
              paddingVertical: 22,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: colors.primary,
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
                  color: colors.textPrimary,
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
                  color: colors.textSecondary,
                  fontSize: 12,
                  fontWeight: '500',
                  lineHeight: 17,
                }}
              >
                Buzdolabının fotoğrafını çek, AI malzemeleri tanısın
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.iconDefault} />
          </TouchableOpacity>
        </View>

        {/* ── Eksik Listemi Oluştur Butonu (Buzdolabı ikizi varsa) ── */}
        {fridgeItems && fridgeItems.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowMarketOptionsModal(true)}
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderRadius: 20,
                paddingVertical: 18,
                paddingHorizontal: 20,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.35)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 24 }}>🛒</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '800',
                    letterSpacing: -0.3,
                    marginBottom: 3,
                  }}
                >
                  Eksik Listemi Oluştur
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    fontWeight: '500',
                  }}
                >
                  1 haftalık eksik listeni AI ile oluştur
                </Text>
              </View>

              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={18} color="#10B981" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Buzdolabı Görünümü ── */}
        {(fridgeItems && fridgeItems.length > 0) ? (
          <View style={{ paddingHorizontal: 16 }}>
            {/* Bölüm başlığı */}
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 11,
                fontWeight: '800',
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
                backgroundColor: colors.card,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: colors.cardBorder,
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
                    backgroundColor: colors.iconDefault,
                    borderRadius: 3,
                  }}
                />
              </View>

              {/* Üst bölme */}
              <View
                style={{
                  marginHorizontal: 12,
                  marginTop: 4,
                  backgroundColor: colors.cardHighlight,
                  borderRadius: 16,
                  padding: 14,
                  minHeight: 80,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
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
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500', textAlign: 'center', paddingVertical: 12 }}>
                    Üst bölme boş
                  </Text>
                )}
              </View>

              {/* Ayırıcı çizgi */}
              <View
                style={{
                  height: 2,
                  backgroundColor: colors.divider,
                  marginHorizontal: 12,
                  marginVertical: 8,
                }}
              />

              {/* Alt bölme */}
              <View
                style={{
                  marginHorizontal: 12,
                  marginBottom: 12,
                  backgroundColor: colors.cardHighlight,
                  borderRadius: 16,
                  padding: 14,
                  minHeight: 80,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
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
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500', textAlign: 'center', paddingVertical: 12 }}>
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
                    backgroundColor: colors.iconDefault,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>

            {/* ── Ürün bilgisi ── */}
            <View
              style={{
                marginTop: 12,
                backgroundColor: 'rgba(255, 107, 53, 0.08)',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 107, 53, 0.2)',
              }}
            >
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500', flex: 1 }}>
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
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
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
                backgroundColor: colors.card,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: colors.cardBorder,
                paddingVertical: 50,
                paddingHorizontal: 30,
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text style={{ fontSize: 56, marginBottom: 16 }}>🧊</Text>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                Buzdolabınız boş
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
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
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
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
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
            Fotoğraf Önizleme
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              overflow: 'hidden',
              aspectRatio: 3 / 4,
              width: '100%',
              marginBottom: 30,
              borderWidth: 1,
              borderColor: colors.cardBorder,
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
                backgroundColor: colors.card,
                paddingVertical: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="camera-reverse" size={20} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Tekrar Çek</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmImage}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
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
            <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '600' }}>İptal</Text>
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

      {/* ── Market Listesi Tercih Modalı ── */}
      <Modal
        visible={showMarketOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMarketOptionsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end',marginBottom:-65 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              style={{
                backgroundColor: '#1E293B',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                maxHeight: '90%',
                borderTopWidth: 1,
                borderColor: 'rgba(71, 85, 105, 0.4)',
              }}
            >
              {/* Handle bar */}
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

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="sparkles" size={22} color="#10B981" />
                  </View>
                  <View>
                    <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800' }}>AI Market Tercihleri</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500' }}>Analiz için parametrelerinizi seçin</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowMarketOptionsModal(false)}>
                  <Ionicons name="close-circle" size={26} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
                {/* Kişi Sayısı */}
                <View>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Kişi Sayısı</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {['1', '2', '3', '4', '5', '6', '8', '10'].map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => setMarketKisiSayisi(num)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: marketKisiSayisi === num ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          borderWidth: 1,
                          borderColor: marketKisiSayisi === num ? '#10B981' : 'rgba(71, 85, 105, 0.3)',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: marketKisiSayisi === num ? '#10B981' : '#94A3B8', fontWeight: '700', fontSize: 13 }}>{num} Kişi</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Süre (dk) */}
                <View style={{ marginTop: 4 }}>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Hazırlık & Pişirme Süresi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {['15', '30', '45', '60', '90', '120'].map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        onPress={() => setMarketSureDakika(mins)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: marketSureDakika === mins ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          borderWidth: 1,
                          borderColor: marketSureDakika === mins ? '#10B981' : 'rgba(71, 85, 105, 0.3)',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: marketSureDakika === mins ? '#10B981' : '#94A3B8', fontWeight: '700', fontSize: 12 }}>{mins} Dk</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Diyet Tercihi */}
                <View>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Diyet Tercihi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {[
                      { id: 'normal', label: 'Normal' },
                      { id: 'vejetaryen', label: 'Vejetaryen' },
                      { id: 'vegan', label: 'Vegan' },
                      { id: 'glutensiz', label: 'Glutensiz' },
                      { id: 'ketojenik', label: 'Ketojenik' },
                    ].map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => setMarketDiyet(d.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: marketDiyet === d.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          borderWidth: 1,
                          borderColor: marketDiyet === d.id ? '#10B981' : 'rgba(71, 85, 105, 0.3)',
                        }}
                      >
                        <Text style={{ color: marketDiyet === d.id ? '#10B981' : '#94A3B8', fontSize: 12, fontWeight: '700' }}>{d.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Hedef */}
                <View>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Beslenme Hedefi</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {[
                      { id: 'normal', label: 'Normal' },
                      { id: 'kilo_verme', label: 'Kilo Verme' },
                      { id: 'kas_kazanma', label: 'Kas Kazanma' },
                      { id: 'form_koruma', label: 'Form Koruma' },
                    ].map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        onPress={() => setMarketHedef(h.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: marketHedef === h.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          borderWidth: 1,
                          borderColor: marketHedef === h.id ? '#10B981' : 'rgba(71, 85, 105, 0.3)',
                        }}
                      >
                        <Text style={{ color: marketHedef === h.id ? '#10B981' : '#94A3B8', fontSize: 12, fontWeight: '700' }}>{h.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Öğün */}
                <View>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Hedef Öğün</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { id: 'kahvaltı', label: 'Kahvaltı' },
                      { id: 'öğle', label: 'Öğle' },
                      { id: 'akşam', label: 'Akşam' },
                      { id: 'ara_öğün', label: 'Ara Öğün' },
                    ].map((o) => (
                      <TouchableOpacity
                        key={o.id}
                        onPress={() => setMarketOgun(o.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: marketOgun === o.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          borderWidth: 1,
                          borderColor: marketOgun === o.id ? '#10B981' : 'rgba(71, 85, 105, 0.3)',
                        }}
                      >
                        <Text style={{ color: marketOgun === o.id ? '#10B981' : '#94A3B8', fontSize: 12, fontWeight: '700' }}>{o.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Alerjenler */}
                <View>
                  <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Dikkate Alınacak Alerjenler</Text>
                  {allergens && allergens.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {allergens.map((alg) => {
                        const isSelected = selectedAllergens.includes(alg.allergen_name);
                        return (
                          <TouchableOpacity
                            key={alg.id}
                            onPress={() => {
                              if (isSelected) {
                                setSelectedAllergens(selectedAllergens.filter((a) => a !== alg.allergen_name));
                              } else {
                                setSelectedAllergens([...selectedAllergens, alg.allergen_name]);
                              }
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                              borderWidth: 1,
                              borderColor: isSelected ? '#EF4444' : 'rgba(71, 85, 105, 0.3)',
                            }}
                          >
                            <Text style={{ color: isSelected ? '#EF4444' : '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                              {isSelected ? '✓ ' : ''}{alg.allergen_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={{ color: '#64748B', fontSize: 12, fontStyle: 'italic' }}>Kayıtlı alerjeniniz yok</Text>
                  )}
                </View>
              </ScrollView>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleGenerateMarketList}
                disabled={isMarketLoading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#10B981',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 10,
                  marginTop: 8,
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                {isMarketLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>AI ile Eksik Listesi Hazırla</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
      }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
        Yeni Ürün Ekle
      </Text>

      {/* İsim */}
      <View
        style={{
          backgroundColor: colors.inputBg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 10,
        }}
      >
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="Ürün adı"
          placeholderTextColor={colors.textMuted}
          style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', padding: 0 }}
        />
      </View>

      {/* Miktar + Birim */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.inputBg,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <TextInput
            value={miktar}
            onChangeText={onMiktarChange}
            placeholder="Miktar"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', padding: 0, textAlign: 'center' }}
          />
        </View>

        <TouchableOpacity
          onPress={onBirimPress}
          activeOpacity={0.7}
          style={{
            flex: 1,
            backgroundColor: colors.inputBg,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            {BIRIM_LABELS[birim] || birim}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
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
            backgroundColor: colors.badgeBg,
          }}
        >
          <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 14 }}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAdd}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: colors.primary,
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
