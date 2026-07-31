import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import IngredientCard, { IngredientItem } from '@/components/IngredientCard';

// ─────────────── Sabitler ───────────────
const ALLERGENS_STORAGE_KEY = '@allergens_v1';
const API_INGREDIENTS = 'https://www.themealdb.com/api/json/v1/1/list.php?i=list';

export interface SavedAllergen {
  idIngredient: string;
  strIngredient: string;
}

// ─────────────── Alerjen Kartı (Kaydedilmiş) ───────────────
function AllergenCard({
  allergen,
  onRemove,
}: {
  allergen: SavedAllergen;
  onRemove: (id: string) => void;
}) {
  const imageUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(
    allergen.strIngredient
  )}-Small.png`;

  return (
    <View
      style={{
        width: '31%',
        marginBottom: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 14,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        position: 'relative',
      }}
    >
      {/* Sil Butonu */}
      <TouchableOpacity
        onPress={() => onRemove(allergen.idIngredient)}
        style={{
          position: 'absolute',
          top: 5,
          right: 5,
          zIndex: 2,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderRadius: 8,
          padding: 2,
        }}
      >
        <Ionicons name="close" size={13} color="#EF4444" />
      </TouchableOpacity>

      {/* Resim */}
      <View style={{ width: 48, height: 48, marginTop: 4, marginBottom: 6 }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>

      {/* İsim */}
      <Text
        numberOfLines={2}
        style={{
          color: '#F87171',
          fontSize: 11,
          fontWeight: '700',
          textAlign: 'center',
          lineHeight: 14,
        }}
      >
        {allergen.strIngredient}
      </Text>
    </View>
  );
}

// ─────────────── Ana Ekran ───────────────
export default function AllergensScreen() {
  const [allergens, setAllergens] = useState<SavedAllergen[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<SavedAllergen[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  // ── AsyncStorage Yükle ──
  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(ALLERGENS_STORAGE_KEY);
        if (data) setAllergens(JSON.parse(data));
      } catch (err) {
        console.error('Alerjen yükleme hatası:', err);
      }
    };
    load();
  }, []);

  // ── AsyncStorage Kaydet ──
  const saveAllergens = async (list: SavedAllergen[]) => {
    try {
      await AsyncStorage.setItem(ALLERGENS_STORAGE_KEY, JSON.stringify(list));
      setAllergens(list);
    } catch (err) {
      console.error('Alerjen kaydetme hatası:', err);
    }
  };

  // ── API: Tüm İçerikleri Çek ──
  const fetchIngredients = async () => {
    if (allIngredients.length > 0) return;
    try {
      setLoading(true);
      const res = await fetch(API_INGREDIENTS);
      const data = await res.json();
      if (data.meals) setAllIngredients(data.meals as IngredientItem[]);
    } catch (err) {
      console.error('İçerik yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Modal Aç ──
  const handleOpenModal = () => {
    setSelected([]);
    setSearchQuery('');
    setVisibleCount(15);
    setModalVisible(true);
    fetchIngredients();
  };

  // ── Seçim Toggle ──
  const handleToggle = useCallback((item: IngredientItem) => {
    setSelected((prev) => {
      const exists = prev.some((a) => a.idIngredient === item.idIngredient);
      if (exists) return prev.filter((a) => a.idIngredient !== item.idIngredient);
      return [...prev, { idIngredient: item.idIngredient, strIngredient: item.strIngredient }];
    });
  }, []);

  // ── Kaydet ──
  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    const existingIds = new Set(allergens.map((a) => a.idIngredient));
    const newOnes = selected.filter((s) => !existingIds.has(s.idIngredient));
    const merged = [...allergens, ...newOnes];
    await saveAllergens(merged);
    setSaving(false);
    setModalVisible(false);
  };

  // ── Sil ──
  const handleRemove = (id: string) => {
    Alert.alert('Alerjeni Kaldır', 'Bu alerjeni listeden kaldırmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          const updated = allergens.filter((a) => a.idIngredient !== id);
          await saveAllergens(updated);
        },
      },
    ]);
  };

  // ── Filtreleme ──
  const filteredIngredients = useMemo(() => {
    if (!searchQuery.trim()) return allIngredients;
    const q = searchQuery.toLowerCase();
    return allIngredients.filter((i) => i.strIngredient.toLowerCase().includes(q));
  }, [allIngredients, searchQuery]);

  const pagedIngredients = useMemo(
    () => filteredIngredients.slice(0, visibleCount),
    [filteredIngredients, visibleCount]
  );

  // ─────────────── RENDER ───────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      {/* İçerik */}
      {allergens.length === 0 ? (
        // ── Boş Durum ──
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
          >
            <Ionicons name="warning-outline" size={48} color="#F59E0B" />
          </View>
          <Text
            style={{
              color: '#F1F5F9',
              fontSize: 20,
              fontWeight: '800',
              textAlign: 'center',
              letterSpacing: -0.3,
            }}
          >
            Henüz alerjen eklemediniz
          </Text>
          <Text
            style={{
              color: '#64748B',
              fontSize: 13,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            Alerjenlerinizi belirleyin, uygulama size uygun tarifleri önererek sizi koruyacak.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenModal}
            style={{
              marginTop: 28,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F59E0B',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 16,
              gap: 8,
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Alerjen Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── Dolu Durum ──
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 16,
            }}
          >
            <View>
              <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700' }}>
                {allergens.length} alerjen kayıtlı
              </Text>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                Tarif önerilerinde dikkate alınır
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenModal}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F59E0B',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                gap: 6,
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Ekle</Text>
            </TouchableOpacity>
          </View>

          {/* Uyarı Bandı */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#EF4444" />
            <Text style={{ color: '#FDA4AF', fontSize: 12, fontWeight: '600', flex: 1 }}>
              Bu ürünleri içeren tarifler sana önerilmeyecek
            </Text>
          </View>

          {/* Grid */}
          <FlatList
            data={allergens}
            keyExtractor={(item) => item.idIngredient}
            numColumns={3}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <AllergenCard allergen={item} onRemove={handleRemove} />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* ── MODAL: Alerjen Seçimi ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(71, 85, 105, 0.3)',
            }}
          >
            <View>
              <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800' }}>Alerjen Seç</Text>
              {selected.length > 0 && (
                <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                  {selected.length} ürün seçildi
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Arama */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 44,
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.4)',
            }}
          >
            <Ionicons name="search-outline" size={17} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={(t) => { setSearchQuery(t); setVisibleCount(15); }}
              placeholder="Malzeme ara..."
              placeholderTextColor="#64748B"
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 14,
                color: '#F1F5F9',
                fontWeight: '500',
                outlineStyle: 'none',
              } as any}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={17} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Liste */}
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={{ color: '#64748B', fontSize: 13, marginTop: 12, fontWeight: '600' }}>
                Ürünler yükleniyor...
              </Text>
            </View>
          ) : (
            <FlatList
              data={pagedIngredients}
              keyExtractor={(item) => item.idIngredient}
              numColumns={3}
              columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
              renderItem={({ item }) => (
                <IngredientCard
                  ingredient={item}
                  isSelected={selected.some((s) => s.idIngredient === item.idIngredient)}
                  onToggle={handleToggle}
                />
              )}
              onEndReached={() => {
                if (visibleCount < filteredIngredients.length) {
                  setVisibleCount((p) => p + 15);
                }
              }}
              onEndReachedThreshold={0.4}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Kaydet Butonu */}
          {selected.length > 0 && (
            <View
              style={{
                position: 'absolute',
                bottom: 32,
                left: 16,
                right: 16,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: '#F59E0B',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                  {saving ? 'Kaydediliyor...' : `${selected.length} Alerjeni Kaydet`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
