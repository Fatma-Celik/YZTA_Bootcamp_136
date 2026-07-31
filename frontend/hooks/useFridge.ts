import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ingredient, generateIngredientId } from '@/utils/ingredientUtils';

const STORAGE_KEY = '@fridge_items';

export function useFridge() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // ── AsyncStorage'dan yükle ──
  const loadItems = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        setItems(JSON.parse(json));
      }
    } catch (e) {
      console.error('[useFridge] Yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── AsyncStorage'a kaydet ──
  const saveItems = useCallback(async (newItems: Ingredient[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (e) {
      console.error('[useFridge] Kaydetme hatası:', e);
    }
  }, []);

  // ── Toplu güncelle (senkronizasyon sonrası) ──
  const updateItems = useCallback(async (newItems: Ingredient[]) => {
    // Mevcut listeye yeni malzemeleri ekle (aynı isimde olanı güncelle)
    const merged = [...items];
    for (const newItem of newItems) {
      const existingIdx = merged.findIndex(
        (m) => m.ad.toLowerCase().trim() === newItem.ad.toLowerCase().trim()
      );
      if (existingIdx >= 0) {
        // Mevcut olanı güncelle
        merged[existingIdx] = { ...merged[existingIdx], miktar: newItem.miktar, birim: newItem.birim };
      } else {
        // Yeni ürün ekle
        merged.push({ ...newItem, id: generateIngredientId('fridge') });
      }
    }
    await saveItems(merged);
  }, [items, saveItems]);

  // ── Tekil ürün ekle ──
  const addItem = useCallback(async (item: Omit<Ingredient, 'id'>) => {
    const newItem: Ingredient = { ...item, id: generateIngredientId('fridge') };
    const newItems = [...items, newItem];
    await saveItems(newItems);
  }, [items, saveItems]);

  // ── Ürün sil ──
  const removeItem = useCallback(async (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    await saveItems(newItems);
  }, [items, saveItems]);

  // ── Tüm listeyi değiştir (overwrite) ──
  const replaceAll = useCallback(async (newItems: Ingredient[]) => {
    await saveItems(newItems);
  }, [saveItems]);

  return { items, loading, loadItems, addItem, removeItem, updateItems, replaceAll };
}
