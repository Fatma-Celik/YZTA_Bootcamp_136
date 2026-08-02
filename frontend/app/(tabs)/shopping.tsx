import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import IngredientCard, { IngredientItem } from '@/components/IngredientCard';
import { useTheme } from '@/contexts/ThemeContext';
import { incrementShoppingStatCount } from '@/hooks/useProfileStats';

// ─────────────── Tipler ───────────────
export type PriorityLevel = 'urgent' | 'important' | 'normal';

export interface SavedIngredient {
  idIngredient: string;
  strIngredient: string;
  kategori?: string;
  tahmini_fiyat?: string;
}

export interface ShoppingList {
  id: string;
  title: string;
  priority: PriorityLevel;
  createdAt: string; // "DD.MM.YYYY"
  isCompleted: boolean;
  items: SavedIngredient[];
  kaynak?: string;
  toplamTahminiTutar?: string;
}

const STORAGE_KEY = '@shopping_lists_v1';
const API_INGREDIENTS = 'https://www.themealdb.com/api/json/v1/1/list.php?i=list';

// Tarih Formatlayıcı (Gün.Ay.Yıl)
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Önem seviyesi renk ve etiketleri
const priorityConfig: Record<PriorityLevel, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Acil', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  important: { label: 'Önemli', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  normal: { label: 'Normal', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
};

export default function TabShoppingScreen() {
  // Ana Ekran State'leri
  const [savedLists, setSavedLists] = useState<ShoppingList[]>([]);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [loadingLists, setLoadingLists] = useState(true);

  // Modallar
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedListDetail, setSelectedListDetail] = useState<ShoppingList | null>(null);

  // Yeni Liste Oluşturma State'leri
  const [newTitle, setNewTitle] = useState('İhtiyaç Listesi');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('normal');
  const [selectedIngredients, setSelectedIngredients] = useState<SavedIngredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [fetchingIngredients, setFetchingIngredients] = useState(false);
  const [savingList, setSavingList] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const { colors } = useTheme();

  // ─────────────── AsyncStorage İşlemleri (Maksimum 10 Liste) ───────────────
  const loadSavedLists = async () => {
    try {
      setLoadingLists(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: ShoppingList[] = JSON.parse(data);
        setSavedLists(parsed.slice(0, 10));
      }
    } catch (error) {
      console.error('AsyncStorage yükleme hatası:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const saveListsToStorage = async (lists: ShoppingList[]) => {
    try {
      // En güncel son 10 liste tutulur
      const trimmed = lists.slice(0, 10);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setSavedLists(trimmed);
    } catch (error) {
      console.error('AsyncStorage kaydetme hatası:', error);
    }
  };

  useEffect(() => {
    loadSavedLists();
  }, []);

  // ─────────────── API: Tüm Ingredient'ları Çek ───────────────
  const fetchAllIngredients = async () => {
    if (allIngredients.length > 0) return;
    try {
      setFetchingIngredients(true);
      const res = await fetch(API_INGREDIENTS);
      const data = await res.json();
      if (data.meals) {
        setAllIngredients(data.meals as IngredientItem[]);
      }
    } catch (err) {
      console.error('Ingredients fetch hatası:', err);
    } finally {
      setFetchingIngredients(false);
    }
  };

  // Yeni Liste Modalını Aç
  const handleOpenCreateModal = () => {
    setNewTitle('İhtiyaç Listesi');
    setNewPriority('normal');
    setSelectedIngredients([]);
    setIngredientSearchQuery('');
    setVisibleCount(12);
    setPriorityDropdownOpen(false);
    setCreateModalVisible(true);
    fetchAllIngredients();
  };

  // Ingredient Seç / Kaldır
  const handleToggleIngredient = (item: IngredientItem) => {
    const exists = selectedIngredients.some((ing) => ing.idIngredient === item.idIngredient);
    if (exists) {
      setSelectedIngredients((prev) =>
        prev.filter((ing) => ing.idIngredient !== item.idIngredient)
      );
    } else {
      setSelectedIngredients((prev) => [
        ...prev,
        { idIngredient: item.idIngredient, strIngredient: item.strIngredient },
      ]);
    }
  };

  // Çip Üzerindeki Çarpıya Tıklayarak Ürün Çıkarma
  const handleRemoveSelectedIngredient = (idIngredient: string) => {
    setSelectedIngredients((prev) => prev.filter((ing) => ing.idIngredient !== idIngredient));
  };

  // Yeni Listeyi Kaydet (En az 1 ürün seçili olmalı!)
  const handleSaveNewList = async () => {
    if (selectedIngredients.length === 0) return;

    setSavingList(true);

    const newList: ShoppingList = {
      id: Date.now().toString(),
      title: newTitle.trim() || 'İhtiyaç Listesi',
      priority: newPriority,
      createdAt: formatDate(new Date()),
      isCompleted: false,
      items: selectedIngredients,
    };

    const updatedLists = [newList, ...savedLists];
    await saveListsToStorage(updatedLists);
    await incrementShoppingStatCount();

    setSavingList(false);
    setCreateModalVisible(false);
  };

  // Liste Tamamlandı / Tamamlanmadı Durumunu Değiştir
  const handleToggleComplete = async (listId: string) => {
    const updated = savedLists.map((item) =>
      item.id === listId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    await saveListsToStorage(updated);
  };

  // Listeyi Silme İşlemi (AsyncStorage & State)
  const handleDeleteList = async (listId: string) => {
    const updated = savedLists.filter((item) => item.id !== listId);
    await saveListsToStorage(updated);
    if (selectedListDetail?.id === listId) {
      setDetailModalVisible(false);
      setSelectedListDetail(null);
    }
  };

  // ─────────────── Filtreleme & Pagination ───────────────
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearchQuery.trim()) return allIngredients;
    const q = ingredientSearchQuery.toLowerCase();
    return allIngredients.filter((ing) => ing.strIngredient.toLowerCase().includes(q));
  }, [allIngredients, ingredientSearchQuery]);

  const pagedIngredients = useMemo(() => {
    return filteredIngredients.slice(0, visibleCount);
  }, [filteredIngredients, visibleCount]);

  const handleLoadMoreIngredients = () => {
    if (visibleCount < filteredIngredients.length) {
      setVisibleCount((prev) => prev + 10);
    }
  };

  const filteredSavedLists = useMemo(() => {
    if (!listSearchQuery.trim()) return savedLists;
    const q = listSearchQuery.toLowerCase();
    return savedLists.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.items.some((item) => item.strIngredient.toLowerCase().includes(q))
    );
  }, [savedLists, listSearchQuery]);

  // ─────────────── RENDER: Ana Ekran ───────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.statusBar} />

      {/* Üst Header Alanı */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>
              Eksik Listeleri
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
              Alışveriş ihtiyaçlarınızı takip edin
            </Text>
          </View>

          {/* Yeni Liste Ekle Butonu */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenCreateModal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FF6B35',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 14,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
              gap: 6,
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Yeni Liste</Text>
          </TouchableOpacity>
        </View>

        {/* Kaydedilmiş Listelerde Arama Barı */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderRadius: 16,
            paddingHorizontal: 14,
            height: 46,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.5)',
          }}
        >
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            value={listSearchQuery}
            onChangeText={setListSearchQuery}
            placeholder="Listelerde veya ürünlerde ara..."
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
          {listSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setListSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kaydedilmiş Listeler Alanı (ScrollView kullanımı) */}
      {loadingLists ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 12, fontWeight: '600' }}>
            Listeler yükleniyor...
          </Text>
        </View>
      ) : filteredSavedLists.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🛒</Text>
          <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
            Henüz Liste Yok
          </Text>
          <Text
            style={{
              color: '#64748B',
              fontSize: 13,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 18,
            }}
          >
            Yeni bir eksik listesi eklemek için yukarıdaki "Yeni Liste" butonuna dokunun.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredSavedLists.map((item) => {
            const pConfig = priorityConfig[item.priority];
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedListDetail(item);
                  setDetailModalVisible(true);
                }}
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.85)',
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: item.isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(71, 85, 105, 0.4)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Başlık ve Önem Badge'i */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: item.isCompleted ? '#94A3B8' : '#F1F5F9',
                        fontSize: 16,
                        fontWeight: '800',
                        textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                        flexShrink: 1,
                      }}
                    >
                      {item.title}
                    </Text>

                    {/* Gemini AI Rozeti */}
                    {item.kaynak === 'gemini' && (
                      <View
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>
                          ✨ AI
                        </Text>
                      </View>
                    )}

                    {/* Önem Rozeti */}
                    <View
                      style={{
                        backgroundColor: pConfig.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: pConfig.color + '40',
                      }}
                    >
                      <Text style={{ color: pConfig.color, fontSize: 10, fontWeight: '800' }}>
                        {pConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* İkonlar: Tamamlandı + Sil Butonu */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => handleToggleComplete(item.id)}
                    >
                      <Ionicons
                        name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={item.isCompleted ? '#10B981' : '#64748B'}
                      />
                    </TouchableOpacity>

                    {/* Çöp Kutusuna Tıklayarak Silme */}
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => handleDeleteList(item.id)}
                    >
                      <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Alt Detaylar (Tarih, Adet ve Toplam Tahmini Tutar) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                    📦 {item.items.length} adet ürün
                  </Text>
                  {item.toplamTahminiTutar ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="wallet-outline" size={14} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>
                        {item.toplamTahminiTutar}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '500' }}>
                      📅 {item.createdAt}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ─────────────── MODAL 1: Yeni Liste Oluşturma ─────────────── */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              height: '90%',
              paddingTop: 12,
            }}
          >
            {/* Tutma Çubuğu */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.iconDefault,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />

            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                Yeni Eksik Listesi
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.iconDefault} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
              {/* Form: Liste Adı */}
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                LİSTE ADI
              </Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="İhtiyaç Listesi"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.inputBg,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 44,
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: '600',
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  marginBottom: 14,
                  outlineStyle: 'none',
                } as any}
              />

              {/* Form: Önem Etiketi Dropdown */}
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                ÖNEM ETİKETİ
              </Text>
              <View style={{ position: 'relative', zIndex: 10, marginBottom: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: priorityConfig[newPriority].color,
                      }}
                    />
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                      {priorityConfig[newPriority].label}
                    </Text>
                  </View>
                  <Ionicons
                    name={priorityDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {/* Dropdown Menü Seçenekleri */}
                {priorityDropdownOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 48,
                      left: 0,
                      right: 0,
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      padding: 6,
                      shadowColor: colors.cardBorder,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                      zIndex: 20,
                    }}
                  >
                    {(['urgent', 'important', 'normal'] as PriorityLevel[]).map((pKey) => (
                      <TouchableOpacity
                        key={pKey}
                        onPress={() => {
                          setNewPriority(pKey);
                          setPriorityDropdownOpen(false);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: newPriority === pKey ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: priorityConfig[pKey].color,
                          }}
                        />
                        <Text
                          style={{
                            color: newPriority === pKey ? '#FF6B35' : colors.textPrimary,
                            fontSize: 13,
                            fontWeight: newPriority === pKey ? '700' : '500',
                          }}
                        >
                          {priorityConfig[pKey].label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Seçilen Ürünler Çip Listesi */}
              {selectedIngredients.length > 0 && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                    SEÇİLEN ÜRÜNLER ({selectedIngredients.length})
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {selectedIngredients.map((ing) => (
                      <View
                        key={ing.idIngredient}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(255, 107, 53, 0.15)',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: 'rgba(255, 107, 53, 0.3)',
                          gap: 6,
                        }}
                      >
                        <Text style={{ color: '#FF6B35', fontSize: 12, fontWeight: '700' }}>
                          {ing.strIngredient}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveSelectedIngredient(ing.idIngredient)}>
                          <Ionicons name="close-circle" size={16} color="#FF6B35" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* İnce Separator */}
              <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 10 }} />

              {/* Ingredient Arama Barı */}
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                ÜRÜN EKLE
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.inputBg,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 42,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  marginBottom: 12,
                }}
              >
                <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                <TextInput
                  value={ingredientSearchQuery}
                  onChangeText={(t) => {
                    setIngredientSearchQuery(t);
                    setVisibleCount(12);
                  }}
                  placeholder="Malzeme ara (ör: Tomato, Chicken)..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 13,
                    color: colors.textPrimary,
                    fontWeight: '500',
                    outlineStyle: 'none',
                  } as any}
                />
                {ingredientSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setIngredientSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Ingredients Grid */}
              {fetchingIngredients ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#FF6B35" />
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
                    Malzemeler yükleniyor...
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {pagedIngredients.map((item) => {
                    const isSelected = selectedIngredients.some(
                      (ing) => ing.idIngredient === item.idIngredient
                    );
                    return (
                      <IngredientCard
                        key={item.idIngredient}
                        ingredient={item}
                        isSelected={isSelected}
                        onToggle={handleToggleIngredient}
                      />
                    );
                  })}
                </View>
              )}

              {/* Daha Fazla Yükle Butonu */}
              {visibleCount < filteredIngredients.length && (
                <TouchableOpacity
                  onPress={handleLoadMoreIngredients}
                  style={{
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: '#FF6B35', fontSize: 12, fontWeight: '700' }}>
                    Daha Fazla Malzeme Göster ({filteredIngredients.length - visibleCount} tane kaldı)
                  </Text>
                </TouchableOpacity>
              )}

              {/* Separator */}
              <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 14 }} />

              {/* Save (Kaydet) Butonu - Ürün seçilmemişse engellenir */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={savingList || selectedIngredients.length === 0}
                onPress={handleSaveNewList}
                style={{
                  backgroundColor: selectedIngredients.length === 0 ? colors.badgeBg : '#FF6B35',
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 30,
                  shadowColor: selectedIngredients.length === 0 ? 'transparent' : '#FF6B35',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: selectedIngredients.length === 0 ? 0 : 5,
                  opacity: selectedIngredients.length === 0 ? 0.6 : 1,
                }}
              >
                {savingList ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
                    {selectedIngredients.length === 0
                      ? 'Lütfen En Az 1 Ürün Seçin'
                      : `Listeyi Kaydet (${selectedIngredients.length} Ürün)`}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────── MODAL 2: Liste Detay Gösterimi (Read-Only) ─────────────── */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
              paddingTop: 12,
              paddingBottom: 24,
            }}
          >
            {/* Tutma Çubuğu */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.iconDefault,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />

            {selectedListDetail && (
              <View style={{ paddingHorizontal: 20 }}>
                {/* Modal Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>
                      {selectedListDetail.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                        📅 {selectedListDetail.createdAt}
                      </Text>
                      <View
                        style={{
                          backgroundColor: priorityConfig[selectedListDetail.priority].bg,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: priorityConfig[selectedListDetail.priority].color, fontSize: 10, fontWeight: '800' }}>
                          {priorityConfig[selectedListDetail.priority].label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => handleDeleteList(selectedListDetail.id)}>
                      <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                      <Ionicons name="close-circle" size={28} color={colors.iconDefault} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Toplam Tahmini Tutar Kartı (Kaynak Gemini ise) */}
                {selectedListDetail.toplamTahminiTutar && (
                  <View
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      borderRadius: 14,
                      padding: 14,
                      marginTop: 8,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="wallet" size={18} color="#10B981" />
                      </View>
                      <View>
                        <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>Toplam Tahmini Tutar</Text>
                        <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>{selectedListDetail.toplamTahminiTutar}</Text>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>✨ AI Hesaplama</Text>
                    </View>
                  </View>
                )}

                {/* Alt Başlık & Separator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: '#FF6B35', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>
                    EKSİKLER ({selectedListDetail.items.length})
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={selectedListDetail.isCompleted ? 'checkmark-circle' : 'time-outline'}
                      size={16}
                      color={selectedListDetail.isCompleted ? '#10B981' : '#F59E0B'}
                    />
                    <Text style={{ color: selectedListDetail.isCompleted ? '#10B981' : '#F59E0B', fontSize: 12, fontWeight: '700' }}>
                      {selectedListDetail.isCompleted ? 'Tamamlandı' : 'Bekliyor'}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 12 }} />

                {/* Salt Okunur Ingredients Listesi */}
                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {selectedListDetail.items.length === 0 ? (
                    <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>
                      Bu listede ürün bulunmuyor.
                    </Text>
                  ) : selectedListDetail.kaynak === 'gemini' || selectedListDetail.items.some((i) => i.kategori || i.tahmini_fiyat) ? (
                    <View style={{ gap: 8,paddingBottom:25 }}>
                      {selectedListDetail.items.map((item, idx) => (
                        <View
                          key={item.idIngredient || `item_${idx}`}
                          style={{
                            backgroundColor: colors.cardHighlight,
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderWidth: 1,
                            borderColor: colors.cardBorder,
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                              {item.strIngredient}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {item.kategori && (
                                <View
                                  style={{
                                    backgroundColor: 'rgba(255, 107, 53, 0.12)',
                                    paddingHorizontal: 7,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 107, 53, 0.3)',
                                  }}
                                >
                                  <Text style={{ color: '#FF6B35', fontSize: 10, fontWeight: '700' }}>
                                    {item.kategori.replace('_', ' ').toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              {item.tahmini_fiyat && (
                                <View
                                  style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                    paddingHorizontal: 7,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 3,
                                  }}
                                >
                                  <Ionicons name="pricetag-outline" size={10} color="#10B981" />
                                  <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>
                                    {item.tahmini_fiyat}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {selectedListDetail.items.map((item) => {
                        const imgUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(
                          item.strIngredient
                        )}-Small.png`;
                        return (
                          <View
                            key={item.idIngredient}
                            style={{
                              width: '31%',
                              backgroundColor: colors.cardHighlight,
                              borderRadius: 14,
                              padding: 10,
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                            }}
                          >
                            <Image
                              source={{ uri: imgUrl }}
                              style={{ width: 44, height: 44, marginBottom: 6 }}
                              resizeMode="contain"
                            />
                            <Text
                              numberOfLines={2}
                              style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'center' }}
                            >
                              {item.strIngredient}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
