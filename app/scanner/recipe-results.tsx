import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeFlow } from '@/hooks/useRecipeFlow';

// ─────────── Tipler ───────────
interface NutritionInfo {
  kalori: string;
  protein: string;
  karbonhidrat: string;
  yag: string;
}

interface ParsedRecipe {
  isim: string;
  malzemeler: string[];
  yapilis: string[];
  besinDegerleri: NutritionInfo;
  sure: string;
  ipucu: string;
}

// ─────────── Parsing Yardımcıları ───────────
function parseRecipes(rawText: string): ParsedRecipe[] {
  // --- ile böl, boş blokları filtrele
  const blocks = rawText.split('---').filter((b) => b.trim().length > 0);

  const recipes: ParsedRecipe[] = [];

  for (const block of blocks) {
    // 🍽️ emojisi yoksa bu bir tarif bloğu değil (giriş paragrafı olabilir)
    if (!block.includes('🍽️')) continue;

    const recipe = parseRecipeBlock(block.trim());
    if (recipe) recipes.push(recipe);
  }

  return recipes;
}

function parseRecipeBlock(block: string): ParsedRecipe | null {
  try {
    // ── İsim: 🍽️ ile başlayan satırı bütünüyle çek ve ** işaretlerini temizle ──
    const nameMatch = block.match(/🍽️\s*(.+?)(?:\n|$)/);
    const isim = nameMatch ? nameMatch[1].replace(/\*\*/g, '').trim() : 'Tarif';

    // ── Malzemeler: 📝 ile 👨‍🍳 arasından çek ──
    const malzemelerSection = extractBetween(block, '📝', '👨‍🍳') ||
                              extractBetween(block, '📝', '👨🍳');
    const malzemeler = malzemelerSection
      ? malzemelerSection
          .split('\n')
          .filter((line) => {
            const trimmed = line.trim();
            return trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•');
          })
          .map((line) => line.trim().replace(/^[-*•]\s*/, ''))
      : [];

    // ── Yapılış: 👨‍🍳 (veya 👨🍳) ile 📊 arasından çek ──
    const yapilisSection = extractBetween(block, '👨‍🍳', '📊') ||
                           extractBetween(block, '👨🍳', '📊');
    let yapilis = yapilisSection
      ? yapilisSection
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [];

    // Eğer numaralı liste stili varsa temizle, yoksa normal satırları al
    const numberedSteps = yapilis.filter((line) => /^\d+\./.test(line));
    if (numberedSteps.length > 0) {
      yapilis = numberedSteps.map((line) => line.replace(/^\d+\.\s*/, ''));
    } else {
      yapilis = yapilis.map((line) => line.replace(/^[-*•]\s*/, ''));
    }

    // ── Besin Değerleri: 📊 ile ⏱️ arasından çek ──
    const besinSection = extractBetween(block, '📊', '⏱️');
    const besinDegerleri = parseNutrition(besinSection || '');

    // ── Hazırlık Süresi: ⏱️ satırından çek ──
    const sureMatch = block.match(/⏱️\s*(?:Hazırlık Süresi:?\s*)(.+?)(?:\n|$)/);
    const sure = sureMatch ? sureMatch[1].trim() : '';

    // ── İpucu: 💡 satırından çek ──
    const ipucuMatch = block.match(/💡\s*(?:İpucu:?\s*)(.+?)$/s);
    const ipucu = ipucuMatch ? ipucuMatch[1].trim() : '';

    return { isim, malzemeler, yapilis, besinDegerleri, sure, ipucu };
  } catch (e) {
    console.error('[parseRecipeBlock] Hata:', e);
    return null;
  }
}

function extractBetween(text: string, startMarker: string, endMarker: string): string | null {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;

  const afterStart = startIdx + startMarker.length;
  const endIdx = text.indexOf(endMarker, afterStart);
  if (endIdx === -1) return text.slice(afterStart);

  return text.slice(afterStart, endIdx);
}

function parseNutrition(section: string): NutritionInfo {
  const result: NutritionInfo = {
    kalori: '0',
    protein: '0',
    karbonhidrat: '0',
    yag: '0',
  };

  const lines = section.split('\n').filter((l) => {
    const trimmed = l.trim();
    return trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•') || trimmed.includes(':');
  });

  for (const line of lines) {
    const lower = line.toLowerCase();
    const valMatch = line.match(/:\s*(.+)/);
    const val = valMatch ? valMatch[1].trim() : '0';

    if (lower.includes('kalori')) result.kalori = val;
    else if (lower.includes('protein')) result.protein = val;
    else if (lower.includes('karbonhidrat')) result.karbonhidrat = val;
    else if (lower.includes('yağ') || lower.includes('yag')) result.yag = val;
  }

  return result;
}

// Besin değerinden sayısal kısmı çek (ör: "65 kcal" → 65)
function extractNumericValue(str: string): number {
  const match = str.match(/[\d.,]+/);
  return match ? parseFloat(match[0].replace(',', '.')) : 0;
}

// ─────────── Besin Değeri Progress Bar ───────────
function NutritionBar({
  label,
  value,
  maxValue,
  color,
  unit,
}: {
  label: string;
  value: string;
  maxValue: number;
  color: string;
  unit?: string;
}) {
  const numericVal = extractNumericValue(value);
  const percentage = maxValue > 0 ? Math.min((numericVal / maxValue) * 100, 100) : 0;

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
          {value}
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

// ─────────── Tarif Kartı ───────────
function RecipeCard({ recipe, index }: { recipe: ParsedRecipe; index: number }) {
  const [expanded, setExpanded] = useState(false);

  // Farklı accent renkleri
  const accentColors = ['#FF6B35', '#10B981', '#818CF8', '#F59E0B', '#EF4444'];
  const accent = accentColors[index % accentColors.length];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: expanded
          ? `${accent}40`
          : 'rgba(71, 85, 105, 0.3)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <View style={{ padding: 16 }}>
        {/* Tarif İsmi */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${accent}18`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20 }}>🍽️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 16,
                fontWeight: '800',
                letterSpacing: -0.3,
              }}
              numberOfLines={2}
            >
              {recipe.isim}
            </Text>
            {recipe.sure ? (
              <Text
                style={{
                  color: '#64748B',
                  fontSize: 12,
                  fontWeight: '500',
                  marginTop: 3,
                }}
              >
                ⏱️ {recipe.sure}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#64748B"
          />
        </View>

        {/* ── Malzemeler ── */}
        <View
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            📝 Malzemeler
          </Text>
          {recipe.malzemeler.map((m, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: idx < recipe.malzemeler.length - 1 ? 4 : 0,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: accent,
                  marginTop: 6,
                  marginRight: 8,
                  flexShrink: 0,
                }}
              />
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 18,
                  flex: 1,
                }}
              >
                {m}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Besin Değerleri ── */}
        <Text
          style={{
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          📊 Besin Değerleri (1 porsiyon)
        </Text>

        <NutritionBar
          label="Kalori"
          value={recipe.besinDegerleri.kalori}
          maxValue={500}
          color="#FF6B35"
        />
        <NutritionBar
          label="Protein"
          value={recipe.besinDegerleri.protein}
          maxValue={50}
          color="#10B981"
        />
        <NutritionBar
          label="Karbonhidrat"
          value={recipe.besinDegerleri.karbonhidrat}
          maxValue={80}
          color="#818CF8"
        />
        <NutritionBar
          label="Yağ"
          value={recipe.besinDegerleri.yag}
          maxValue={40}
          color="#F59E0B"
        />
      </View>

      {/* ── Yapılış (Expanded) ── */}
      {expanded && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: 'rgba(71, 85, 105, 0.2)',
            padding: 16,
          }}
        >
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            👨‍🍳 Yapılış
          </Text>

          {recipe.yapilis.map((step, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                marginBottom: idx < recipe.yapilis.length - 1 ? 12 : 0,
                alignItems: 'flex-start',
              }}
            >
              {/* Adım Numarası */}
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: `${accent}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{
                    color: accent,
                    fontSize: 12,
                    fontWeight: '800',
                  }}
                >
                  {idx + 1}
                </Text>
              </View>

              {/* Adım İçeriği */}
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 14,
                  fontWeight: '500',
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                {step}
              </Text>
            </View>
          ))}

          {/* İpucu */}
          {recipe.ipucu ? (
            <View
              style={{
                marginTop: 14,
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                borderWidth: 1,
                borderColor: 'rgba(245, 158, 11, 0.2)',
              }}
            >
              <Text style={{ fontSize: 14, marginTop: 1 }}>💡</Text>
              <Text
                style={{
                  color: '#CBD5E1',
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 19,
                  flex: 1,
                }}
              >
                {recipe.ipucu}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─────────── Ana Ekran ───────────
export default function RecipeResultsScreen() {
  const { recipeResponse } = useRecipeFlow();

  const recipes = useMemo(() => {
    if (!recipeResponse) return [];
    return parseRecipes(recipeResponse);
  }, [recipeResponse]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Badge ── */}
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
            marginBottom: 16,
          }}
        >
          <Ionicons name="sparkles" size={18} color="#FF6B35" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              AI Tarif Önerileri
            </Text>
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 12,
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              {recipes.length} tarif üretildi — detaylar için karta dokunun
            </Text>
          </View>
        </View>

        {/* ── Tarif Listesi ── */}
        {recipes.map((recipe, idx) => (
          <RecipeCard key={idx} recipe={recipe} index={idx} />
        ))}

        {recipes.length === 0 && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
            }}
          >
            <Ionicons name="alert-circle-outline" size={48} color="#475569" />
            <Text
              style={{
                color: '#64748B',
                fontSize: 16,
                fontWeight: '600',
                marginTop: 12,
              }}
            >
              Tarif bulunamadı
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
