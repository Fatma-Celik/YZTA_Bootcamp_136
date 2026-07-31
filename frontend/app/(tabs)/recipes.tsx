import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Keyboard,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import RecipeCard, { type RecipeMeal } from "@/components/RecipeCard";

// ─────────────── Tipler ───────────────
type AppMode = "explore" | "search" | "filter";

interface CategoryItem {
  strCategory: string;
}

interface AreaItem {
  strArea: string;
  strCountry?: string;
}

// ─────────────── API Sabitleri ───────────────
const API_BASE = "https://www.themealdb.com/api/json/v1/1";
const INITIAL_LOAD_COUNT = 10;
const LOAD_MORE_COUNT = 6;

// ─────────────── Loading Overlay Component ───────────────
function LoadingOverlay({
  visible,
  message,
}: {
  visible: boolean;
  message?: string;
}) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}>
      <View style={{ width: 100, height: 100, marginBottom: 12 }}>
        <LottieView
          source={require("@/assets/animations/loadingAnimation.json")}
          autoPlay
          loop
          style={{ width: '100%', height: '100%' }} />
      </View>

      <Text
        style={{
          color: "#CBD5E1",
          fontSize: 15,
          fontWeight: "700",
          marginTop: -5,
          letterSpacing: 0.3,
        }}
      >
        {message || "Tarifler yükleniyor..."}
      </Text>
    </View>
  );
}

// ─────────────── Ana Component ───────────────
export default function TabRecipesScreen() {
  // State
  const [meals, setMeals] = useState<RecipeMeal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mode, setMode] = useState<AppMode>("explore");
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [loadingMessage, setLoadingMessage] = useState(
    "Tarifler yükleniyor...",
  );

  // Duplikasyon kontrolü için Set
  const loadedIdsRef = useRef<Set<string>>(new Set());
  // Debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FlatList ref
  const flatListRef = useRef<FlatList>(null);

  // ─────────────── API Fonksiyonları ───────────────

  // Tek bir random yemek çek (tam detaylı)
  const fetchOneRandom = async (): Promise<RecipeMeal | null> => {
    try {
      const res = await fetch(`${API_BASE}/random.php`);
      const data = await res.json();
      if (data.meals && data.meals.length > 0) {
        return data.meals[0] as RecipeMeal;
      }
    } catch (err) {
      console.error("Random fetch hatası:", err);
    }
    return null;
  };

  // Birden fazla unique random yemek çek
  const fetchRandomMeals = async (count: number): Promise<RecipeMeal[]> => {
    const results: RecipeMeal[] = [];
    let attempts = 0;
    const maxAttempts = count * 3; // Sonsuz döngüyü önle

    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      const meal = await fetchOneRandom();
      if (meal && !loadedIdsRef.current.has(meal.idMeal)) {
        loadedIdsRef.current.add(meal.idMeal);
        results.push(meal);
      }
    }
    return results;
  };

  // İsme göre arama
  const searchMeals = async (query: string): Promise<RecipeMeal[]> => {
    try {
      const res = await fetch(
        `${API_BASE}/search.php?s=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      return (data.meals || []) as RecipeMeal[];
    } catch (err) {
      console.error("Arama hatası:", err);
      return [];
    }
  };

  // ID ile detaylı yemek bilgisi çek
  const lookupMealById = async (id: string): Promise<RecipeMeal | null> => {
    try {
      const res = await fetch(`${API_BASE}/lookup.php?i=${id}`);
      const data = await res.json();
      if (data.meals && data.meals.length > 0) {
        return data.meals[0] as RecipeMeal;
      }
    } catch (err) {
      console.error("Lookup hatası:", err);
    }
    return null;
  };

  // Kategoriye göre filtrele + lookup ile detay çek
  const filterByCategory = async (category: string): Promise<RecipeMeal[]> => {
    try {
      const res = await fetch(
        `${API_BASE}/filter.php?c=${encodeURIComponent(category)}`,
      );
      const data = await res.json();
      const filtered = (data.meals || []) as any[];

      // Her bir sonucun detayını lookup ile çek (ilk 20 ile sınırla)
      const detailedMeals = await Promise.all(
        filtered.slice(0, 20).map((m: any) => lookupMealById(m.idMeal)),
      );
      return detailedMeals.filter((m): m is RecipeMeal => m !== null);
    } catch (err) {
      console.error("Kategori filtre hatası:", err);
      return [];
    }
  };

  // Ülkeye göre filtrele + lookup ile detay çek
  const filterByArea = async (area: string): Promise<RecipeMeal[]> => {
    try {
      const res = await fetch(
        `${API_BASE}/filter.php?a=${encodeURIComponent(area)}`,
      );
      const data = await res.json();
      const filtered = (data.meals || []) as any[];

      const detailedMeals = await Promise.all(
        filtered.slice(0, 20).map((m: any) => lookupMealById(m.idMeal)),
      );
      return detailedMeals.filter((m): m is RecipeMeal => m !== null);
    } catch (err) {
      console.error("Area filtre hatası:", err);
      return [];
    }
  };

  // Kategori ve alan listelerini çek
  const fetchFilterLists = async () => {
    try {
      const [catRes, areaRes] = await Promise.all([
        fetch(`${API_BASE}/list.php?c=list`),
        fetch(`${API_BASE}/list.php?a=list`),
      ]);
      const catData = await catRes.json();
      const areaData = await areaRes.json();

      setCategories(catData.meals || []);
      setAreas(areaData.meals || []);
    } catch (err) {
      console.error("Liste çekme hatası:", err);
    }
  };

  // ─────────────── Başlangıç Yükleme ───────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadingMessage("Tarifler keşfediliyor...");
      await fetchFilterLists();
      const randomMeals = await fetchRandomMeals(INITIAL_LOAD_COUNT);
      setMeals(randomMeals);
      setLoading(false);
    };
    init();
  }, []);

  // ─────────────── Infinite Scroll (Sadece Explore Modunda) ───────────────
  const handleLoadMore = useCallback(async () => {
    if (mode !== "explore" || loadingMore || loading) return;

    setLoadingMore(true);
    const moreMeals = await fetchRandomMeals(LOAD_MORE_COUNT);
    setMeals((prev) => [...prev, ...moreMeals]);
    setLoadingMore(false);
  }, [mode, loadingMore, loading]);

  // ─────────────── Arama Handler ───────────────
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // Önceki debounce timer'ı temizle
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim() === "") {
      // Boş query → explore moduna dön ama input'u kapatma
      setMode("explore");
      setSelectedCategory(null);
      setSelectedArea(null);
      setLoading(true);
      setLoadingMessage("Tarifler keşfediliyor...");
      loadedIdsRef.current.clear();
      fetchRandomMeals(INITIAL_LOAD_COUNT).then((randomMeals) => {
        setMeals(randomMeals);
        setLoading(false);
      });
      return;
    }

    // Filtre seçimlerini sıfırla
    setSelectedCategory(null);
    setSelectedArea(null);

    // 500ms debounce — daha fazla zaman tanı ki her harf için istek atmasın
    debounceTimerRef.current = setTimeout(async () => {
      setMode("search");
      setLoading(true);
      setLoadingMessage(`"${text.trim()}" aranıyor...`);
      const results = await searchMeals(text.trim());
      setMeals(results);
      setLoading(false);
    }, 500);
  }, []);

  // ─────────────── Explore Moduna Dön ───────────────
  const resetToExplore = useCallback(async () => {
    setMode("explore");
    setSelectedCategory(null);
    setSelectedArea(null);
    setSearchQuery("");
    setLoading(true);
    setLoadingMessage("Tarifler keşfediliyor...");
    loadedIdsRef.current.clear();
    const randomMeals = await fetchRandomMeals(INITIAL_LOAD_COUNT);
    setMeals(randomMeals);
    setLoading(false);
  }, []);

  // ─────────────── Kategori Filtresi ───────────────
  const handleCategorySelect = useCallback(async (category: string | null) => {
    Keyboard.dismiss();
    if (category === null) {
      resetToExplore();
      return;
    }

    setSelectedCategory(category);
    setSelectedArea(null);
    setSearchQuery("");
    setMode("filter");
    setLoading(true);
    setLoadingMessage(`${category} tarifleri yükleniyor...`);

    let results = await filterByCategory(category);

    setMeals(results);
    setLoading(false);
  }, []);

  // ─────────────── Ülke Filtresi ───────────────
  const handleAreaSelect = useCallback(async (area: string | null) => {
    setAreaModalVisible(false);
    Keyboard.dismiss();
    if (area === null) {
      resetToExplore();
      return;
    }

    setSelectedArea(area);
    setSelectedCategory(null);
    setSearchQuery("");
    setMode("filter");
    setLoading(true);
    setLoadingMessage(`${area} mutfağı yükleniyor...`);

    let results = await filterByArea(area);

    setMeals(results);
    setLoading(false);
  }, []);

  // ─────────────── Area Modal içinde filtreleme ───────────────
  const filteredAreas = areas.filter((a) =>
    a.strArea.toLowerCase().includes(areaSearchQuery.toLowerCase()),
  );

  // ─────────────── Render Helpers ───────────────

  const renderMealItem = useCallback(({ item }: { item: RecipeMeal }) => {
    return (
      <View style={{ paddingHorizontal: 6 }}>
        <RecipeCard meal={item} />
      </View>
    );
  }, []);

  // ─────────────── MEMOIZED HEADER ───────────────
  // useMemo ile header'ı memoize ediyoruz ki her state değişikliğinde
  // FlatList header'ı yeniden oluşturulmasın ve TextInput focus kaybetmesin
  const listHeader = useMemo(
    () => (
      <View>
        {/* Arama Barı */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(30, 41, 59, 0.9)",
              borderRadius: 16,
              paddingHorizontal: 16,
              height: 48,
              borderWidth: 1,
              borderColor: "rgba(71, 85, 105, 0.5)",
            }}
          >
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Tarif ara..."
              placeholderTextColor="#64748B"
              style={
                {
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 15,
                  color: "#F1F5F9",
                  fontWeight: "500",
                  outlineStyle: "none",
                } as any
              }
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange("")}>
                <Ionicons name="close-circle" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Kategori Chip'leri */}
        <View style={{ paddingBottom: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* "Tümü" Chip */}
            <TouchableOpacity
              onPress={() => handleCategorySelect(null)}
              style={{
                backgroundColor:
                  selectedCategory === null && mode === "explore"
                    ? "#FF6B35"
                    : "rgba(51, 65, 85, 0.8)",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor:
                  selectedCategory === null && mode === "explore"
                    ? "#FF6B35"
                    : "rgba(71, 85, 105, 0.5)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color:
                    selectedCategory === null && mode === "explore"
                      ? "#FFFFFF"
                      : "#CBD5E1",
                }}
              >
                🍽️ Tümü
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.strCategory}
                onPress={() => handleCategorySelect(cat.strCategory)}
                style={{
                  backgroundColor:
                    selectedCategory === cat.strCategory
                      ? "#FF6B35"
                      : "rgba(51, 65, 85, 0.8)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor:
                    selectedCategory === cat.strCategory
                      ? "#FF6B35"
                      : "rgba(71, 85, 105, 0.5)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      selectedCategory === cat.strCategory
                        ? "#FFFFFF"
                        : "#CBD5E1",
                  }}
                >
                  {cat.strCategory}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ülke Filtresi Butonu */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <TouchableOpacity
            onPress={() => {
              setAreaSearchQuery("");
              setAreaModalVisible(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(30, 41, 59, 0.6)",
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 42,
              borderWidth: 1,
              borderColor: "rgba(71, 85, 105, 0.4)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="globe-outline" size={18} color="#94A3B8" />
              <Text
                style={{
                  color: selectedArea ? "#FF6B35" : "#94A3B8",
                  fontSize: 13,
                  fontWeight: "600",
                  marginLeft: 8,
                }}
              >
                {selectedArea
                  ? `${selectedArea} Mutfağı`
                  : "Ülkeye Göre Filtrele"}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {selectedArea && (
                <TouchableOpacity
                  onPress={() => handleAreaSelect(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Aktif Filtre Göstergesi */}
        {mode !== "explore" && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 107, 53, 0.15)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(255, 107, 53, 0.3)",
                }}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: "700", color: "#FB923C" }}
                >
                  {mode === "search"
                    ? `"${searchQuery}" için sonuçlar`
                    : selectedCategory
                      ? `${selectedCategory} kategorisi`
                      : selectedArea
                        ? `${selectedArea} mutfağı`
                        : ""}
                </Text>
              </View>
              <Text
                style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}
              >
                {meals.length} tarif
              </Text>
            </View>
            <TouchableOpacity onPress={resetToExplore}>
              <Text
                style={{ fontSize: 11, color: "#FF6B35", fontWeight: "700" }}
              >
                Temizle
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [
      searchQuery,
      selectedCategory,
      selectedArea,
      mode,
      categories,
      meals.length,
    ],
  );

  // FlatList Footer (loading spinner veya lottie)
  const listFooter = useMemo(() => {
    if (!loadingMore) return <View style={{ height: 100 }} />;
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <View style={{ width: 80, height: 80, marginBottom: 8 }}>
          <LottieView
            source={require("@/assets/animations/loadingAnimation.json")}
            autoPlay
            loop
            style={{ width: '100%', height: '100%' }} />
        </View>
        <Text
          style={{
            color: "#64748B",
            fontSize: 12,
            marginTop: -4,
            fontWeight: "600",
          }}
        >
          Daha fazla tarif yükleniyor...
        </Text>
      </View>
    );
  }, [loadingMore]);

  // Sonuç bulunamadı
  const listEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View
        style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 40 }}
      >
        <Text style={{ fontSize: 48 }}>🍳</Text>
        <Text
          style={{
            color: "#F1F5F9",
            fontSize: 18,
            fontWeight: "800",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Tarif Bulunamadı
        </Text>
        <Text
          style={{
            color: "#64748B",
            fontSize: 13,
            fontWeight: "500",
            marginTop: 8,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Arama teriminizi veya filtreleri değiştirmeyi deneyin.
        </Text>
        <TouchableOpacity
          onPress={resetToExplore}
          style={{
            marginTop: 20,
            backgroundColor: "#FF6B35",
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>
            Keşfet Moduna Dön
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading]);

  // ─────────────── Area Seçim Modalı ───────────────
  const renderAreaModal = () => (
    <Modal
      visible={areaModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setAreaModalVisible(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#1E293B",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "70%",
            paddingTop: 12,
          }}
        >
          {/* Tutma Çubuğu */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#475569",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          {/* Modal Başlık */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 12,
            }}
          >
            <Text style={{ color: "#F1F5F9", fontSize: 18, fontWeight: "800" }}>
              🌍 Ülke Seçin
            </Text>
            <TouchableOpacity onPress={() => setAreaModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Modal İçi Arama */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(30, 41, 59, 0.9)",
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 40,
                borderWidth: 1,
                borderColor: "rgba(71, 85, 105, 0.5)",
              }}
            >
              <Ionicons name="search-outline" size={16} color="#64748B" />
              <TextInput
                value={areaSearchQuery}
                onChangeText={setAreaSearchQuery}
                placeholder="Ülke ara..."
                placeholderTextColor="#475569"
                style={
                  {
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 14,
                    color: "#F1F5F9",
                    outlineStyle: "none",
                  } as any
                }
              />
            </View>
          </View>

          {/* Ülke Listesi */}
          <FlatList
            data={filteredAreas}
            keyExtractor={(item, idx) => `${item.strArea}-${idx}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleAreaSelect(item.strArea)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(71, 85, 105, 0.2)",
                  backgroundColor:
                    selectedArea === item.strArea
                      ? "rgba(255, 107, 53, 0.1)"
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color:
                      selectedArea === item.strArea ? "#FF6B35" : "#CBD5E1",
                    fontSize: 14,
                    fontWeight: selectedArea === item.strArea ? "700" : "500",
                  }}
                >
                  {item.strArea}
                </Text>
                {item.strCountry && (
                  <Text
                    style={{
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    {item.strCountry}
                  </Text>
                )}
                {selectedArea === item.strArea && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#FF6B35"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </TouchableOpacity>
            )}
            style={{ maxHeight: 400 }}
          />
        </View>
      </View>
    </Modal>
  );

  // ─────────────── Ana Render ───────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar barStyle="light-content" />

      <FlatList
        ref={flatListRef}
        data={loading ? [] : meals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.idMeal}
        numColumns={2}
        columnWrapperStyle={{
          paddingHorizontal: 12,
          justifyContent: "space-between",
        }}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // Performans optimizasyonları
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={10}
        initialNumToRender={6}
      />

      {/* Loading Overlay — Lottie animasyon */}
      <LoadingOverlay visible={loading} message={loadingMessage} />

      {renderAreaModal()}
    </SafeAreaView>
  );
}
