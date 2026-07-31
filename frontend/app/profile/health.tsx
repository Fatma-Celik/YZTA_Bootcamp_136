import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect, Polygon } from 'react-native-svg';

// ─────────────── Sabitler ───────────────
const HEALTH_PROFILE_KEY = '@health_profile_v1';
const WEIGHT_LOG_KEY = '@weight_log_v1';
const MAX_LOG_ENTRIES = 20;

export interface HealthProfile {
  height: number; // cm
  age: number;
}

export interface WeightEntry {
  date: string;   // "DD.MM.YYYY"
  weight: number; // kg
}

// ─── Tarih Formatlayıcı ───
const formatDate = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}`;
};

const formatDateFull = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
};

// ─── BMI Hesabı ───
const calcBMI = (weightKg: number, heightCm: number): number => {
  if (!heightCm || heightCm < 50) return 0;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
};

const bmiCategory = (bmi: number) => {
  if (bmi <= 0) return { label: '—', color: '#64748B' };
  if (bmi < 18.5) return { label: 'Zayıf', color: '#60A5FA' };
  if (bmi < 25) return { label: 'Normal ✓', color: '#10B981' };
  if (bmi < 30) return { label: 'Fazla Kilolu', color: '#F59E0B' };
  return { label: 'Obez', color: '#EF4444' };
};

// ─────────────── Kilo Grafiği ───────────────
function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) {
    return (
      <View
        style={{
          height: 160,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderWidth: 1,
          borderColor: 'rgba(71, 85, 105, 0.2)',
          borderStyle: 'dashed',
        }}
      >
        <Ionicons name="bar-chart-outline" size={32} color="#334155" />
        <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600', marginTop: 8 }}>
          En az 2 kayıt gerekli
        </Text>
      </View>
    );
  }

  const W = 320;
  const H = 160;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;

  const weights = entries.map((e) => e.weight);
  const minW = Math.floor(Math.min(...weights) - 2);
  const maxW = Math.ceil(Math.max(...weights) + 2);
  const range = maxW - minW || 1;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const toX = (i: number) => PAD_L + (i / (entries.length - 1)) * chartW;
  const toY = (w: number) => PAD_T + chartH - ((w - minW) / range) * chartH;

  const points = entries.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(' ');
  const fillPoints = [
    `${PAD_L},${PAD_T + chartH}`,
    ...entries.map((e, i) => `${toX(i)},${toY(e.weight)}`),
    `${toX(entries.length - 1)},${PAD_T + chartH}`,
  ].join(' ');

  const last = entries[entries.length - 1];

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Yatay çizgi referansları */}
      {[0, 0.5, 1].map((frac, idx) => {
        const yPos = PAD_T + chartH * frac;
        const wLabel = Math.round(maxW - frac * range);
        return (
          <React.Fragment key={idx}>
            <Line
              x1={PAD_L}
              y1={yPos}
              x2={W - PAD_R}
              y2={yPos}
              stroke="rgba(71,85,105,0.2)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <SvgText
              x={PAD_L - 6}
              y={yPos + 4}
              fill="#475569"
              fontSize="9"
              textAnchor="end"
              fontWeight="600"
            >
              {wLabel}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Dolgu */}
      <Polygon points={fillPoints} fill="url(#chartGrad)" />

      {/* Çizgi */}
      <Polyline
        points={points}
        fill="none"
        stroke="#FF6B35"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Noktalar */}
      {entries.map((e, i) => {
        const isLast = i === entries.length - 1;
        return (
          <React.Fragment key={i}>
            <Circle
              cx={toX(i)}
              cy={toY(e.weight)}
              r={isLast ? 5 : 3.5}
              fill={isLast ? '#FF6B35' : '#1E293B'}
              stroke="#FF6B35"
              strokeWidth={isLast ? 2 : 1.5}
            />
            {/* X ekseni etiketi */}
            {(i === 0 || i === entries.length - 1 || (entries.length <= 5)) && (
              <SvgText
                x={toX(i)}
                y={H - 4}
                fill="#475569"
                fontSize="8"
                textAnchor="middle"
                fontWeight="600"
              >
                {e.date.slice(0, 5)}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}

      {/* Son nokta etiketi */}
      <SvgText
        x={toX(entries.length - 1)}
        y={toY(last.weight) - 10}
        fill="#FF6B35"
        fontSize="10"
        textAnchor="middle"
        fontWeight="800"
      >
        {last.weight} kg
      </SvgText>
    </Svg>
  );
}

// ─────────────── Bilgi Satırı ───────────────
function InfoRow({
  label,
  value,
  unit,
  editable = false,
  onPress,
}: {
  label: string;
  value: string;
  unit: string;
  editable?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={editable ? 0.7 : 1}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
          {value} <Text style={{ color: '#64748B', fontSize: 12 }}>{unit}</Text>
        </Text>
        {editable && <Ionicons name="pencil-outline" size={14} color="#475569" />}
      </View>
    </TouchableOpacity>
  );
}

// ─────────────── Ana Ekran ───────────────
export default function HealthScreen() {
  const [profile, setProfile] = useState<HealthProfile>({ height: 175, age: 28 });
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);

  // Edit Profile Modal
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editHeight, setEditHeight] = useState('175');
  const [editAge, setEditAge] = useState('28');

  // Add Weight Modal
  const [addWeightVisible, setAddWeightVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  // ── Yükle ──
  useEffect(() => {
    const load = async () => {
      try {
        const [profData, logData] = await Promise.all([
          AsyncStorage.getItem(HEALTH_PROFILE_KEY),
          AsyncStorage.getItem(WEIGHT_LOG_KEY),
        ]);
        if (profData) setProfile(JSON.parse(profData));
        if (logData) setWeightLog(JSON.parse(logData));
      } catch (err) {
        console.error('Sağlık verisi yükleme hatası:', err);
      }
    };
    load();
  }, []);

  // ── Profil Kaydet ──
  const saveProfile = async (p: HealthProfile) => {
    try {
      await AsyncStorage.setItem(HEALTH_PROFILE_KEY, JSON.stringify(p));
      setProfile(p);
    } catch (err) {
      console.error('Profil kaydetme hatası:', err);
    }
  };

  // ── Kilo Kaydet ──
  const saveWeightLog = async (log: WeightEntry[]) => {
    try {
      await AsyncStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(log));
      setWeightLog(log);
    } catch (err) {
      console.error('Kilo kaydetme hatası:', err);
    }
  };

  // ── Profil Güncelle ──
  const handleSaveProfile = async () => {
    const h = parseFloat(editHeight);
    const a = parseInt(editAge);
    if (!h || h < 100 || h > 250) {
      Alert.alert('Hata', 'Geçerli bir boy değeri girin (100-250 cm)');
      return;
    }
    if (!a || a < 5 || a > 120) {
      Alert.alert('Hata', 'Geçerli bir yaş değeri girin');
      return;
    }
    await saveProfile({ height: h, age: a });
    setEditProfileVisible(false);
  };

  // ── Kilo Ekle ──
  const handleAddWeight = async () => {
    const w = parseFloat(newWeight.replace(',', '.'));
    if (!w || w < 20 || w > 300) {
      Alert.alert('Hata', 'Geçerli bir kilo değeri girin (20-300 kg)');
      return;
    }
    const entry: WeightEntry = {
      date: formatDateFull(new Date()),
      weight: w,
    };
    const updated = [...weightLog, entry].slice(-MAX_LOG_ENTRIES);
    await saveWeightLog(updated);
    setNewWeight('');
    setAddWeightVisible(false);
  };

  // ── BMI Hesabı ──
  const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : 0;
  const bmi = calcBMI(currentWeight, profile.height);
  const bmiCat = bmiCategory(bmi);

  // Son 5 kayıt grafik için
  const chartData = weightLog.slice(-5);

  const idealWeight = () => {
    const h = profile.height / 100;
    return `${(18.5 * h * h).toFixed(0)} – ${(24.9 * h * h).toFixed(0)} kg`;
  };

  // ─────────────── RENDER ───────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Vücut Verileri Kartı ── */}
        <View
          style={{
            margin: 16,
            backgroundColor: '#1E293B',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>Vücut Verileri</Text>
            <TouchableOpacity
              onPress={() => {
                setEditHeight(String(profile.height));
                setEditAge(String(profile.age));
                setEditProfileVisible(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="pencil-outline" size={14} color="#64748B" />
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>Düzenle</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(71, 85, 105, 0.2)', marginBottom: 4 }} />

          <InfoRow label="Boy" value={String(profile.height)} unit="cm" />
          <View style={{ height: 1, backgroundColor: 'rgba(71, 85, 105, 0.15)' }} />
          <InfoRow label="Yaş" value={String(profile.age)} unit="yaş" />
          <View style={{ height: 1, backgroundColor: 'rgba(71, 85, 105, 0.15)' }} />
          <InfoRow
            label="Mevcut Kilo"
            value={currentWeight > 0 ? String(currentWeight) : '—'}
            unit={currentWeight > 0 ? 'kg' : ''}
          />
          <View style={{ height: 1, backgroundColor: 'rgba(71, 85, 105, 0.15)' }} />
          <InfoRow label="İdeal Kilo Aralığı" value={idealWeight()} unit="" />
        </View>

        {/* ── BMI Kartı ── */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: '#1E293B',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)',
          }}
        >
          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700', marginBottom: 16 }}>
            Vücut Kitle Endeksi (BMI)
          </Text>

          {bmi > 0 ? (
            <>
              {/* BMI Değeri */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
                <Text style={{ color: bmiCat.color, fontSize: 48, fontWeight: '900', letterSpacing: -2 }}>
                  {bmi}
                </Text>
                <View style={{ paddingBottom: 8 }}>
                  <Text style={{ color: bmiCat.color, fontSize: 16, fontWeight: '800' }}>
                    {bmiCat.label}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>
                    kg/m²
                  </Text>
                </View>
              </View>

              {/* BMI Skala Barı */}
              <View>
                <View style={{ flexDirection: 'row', height: 8, borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                  <View style={{ flex: 1, backgroundColor: '#60A5FA' }} />
                  <View style={{ flex: 1.3, backgroundColor: '#10B981' }} />
                  <View style={{ flex: 1, backgroundColor: '#F59E0B' }} />
                  <View style={{ flex: 1, backgroundColor: '#EF4444' }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {['<18.5', '18.5–25', '25–30', '>30'].map((lbl) => (
                    <Text key={lbl} style={{ color: '#475569', fontSize: 9, fontWeight: '600' }}>{lbl}</Text>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Ionicons name="calculator-outline" size={36} color="#334155" />
              <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600', marginTop: 8 }}>
                Kilo kaydı ekleyin
              </Text>
            </View>
          )}
        </View>

        {/* ── Kilo Grafiği Kartı ── */}
        <View
          style={{
            margin: 16,
            backgroundColor: '#1E293B',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <View>
              <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>Kilo Takibi</Text>
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                {weightLog.length > 0
                  ? `Son ${Math.min(weightLog.length, 5)} kayıt gösteriliyor`
                  : 'Henüz kayıt yok'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { setNewWeight(''); setAddWeightVisible(true); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FF6B35',
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 13,
                gap: 6,
              }}
            >
              <Ionicons name="add" size={17} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Kilo Ekle</Text>
            </TouchableOpacity>
          </View>

          {/* Grafik */}
          <WeightChart entries={chartData} />

          {/* Son kayıtlar listesi */}
          {weightLog.length > 0 && (
            <View style={{ marginTop: 16, gap: 6 }}>
              <Text style={{ color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                Son Kayıtlar
              </Text>
              {[...weightLog].reverse().slice(0, 5).map((entry, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: idx === 0 ? 'rgba(255, 107, 53, 0.08)' : 'rgba(30, 41, 59, 0.5)',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: idx === 0 ? 'rgba(255, 107, 53, 0.2)' : 'rgba(71, 85, 105, 0.15)',
                  }}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                    {entry.date}
                  </Text>
                  <Text
                    style={{
                      color: idx === 0 ? '#FF6B35' : '#F1F5F9',
                      fontSize: 14,
                      fontWeight: '800',
                    }}
                  >
                    {entry.weight} kg
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Makro Takibi Kartı ── */}
        {currentWeight > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: '#1E293B',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.3)',
            }}
          >
            <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
              Günlük Makro İhtiyacı
            </Text>
            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '500', marginBottom: 16 }}>
              Boy, kilo ve yaşınıza göre tahmini değerler
            </Text>

            {/* Makrolar */}
            {(() => {
              // Mifflin-St Jeor formülü ile TDEE (orta aktiflik × 1.55)
              const bmi = calcBMI(currentWeight, profile.height);
              const bmr = 10 * currentWeight + 6.25 * profile.height - 5 * profile.age + 5;
              const tdee = Math.round(bmr * 1.55);

              // Makro hedefleri (kilo verme hedefi varsayılan)
              const proteinTarget = Math.round(currentWeight * 2.0);     // 2g/kg
              const carbTarget = Math.round((tdee * 0.40) / 4);           // %40 kalori karbdan
              const fatTarget = Math.round((tdee * 0.25) / 9);            // %25 kalori yağdan

              // Statik "bugün alınan" (ileride dinamik bağlanacak)
              const proteinConsumed = Math.round(proteinTarget * 0.72);
              const carbConsumed = Math.round(carbTarget * 0.55);
              const fatConsumed = Math.round(fatTarget * 0.38);

              const macros = [
                {
                  label: 'Protein',
                  icon: 'barbell-outline' as const,
                  color: '#60A5FA',
                  bg: 'rgba(96, 165, 250, 0.12)',
                  consumed: proteinConsumed,
                  target: proteinTarget,
                  unit: 'g',
                },
                {
                  label: 'Karbonhidrat',
                  icon: 'leaf-outline' as const,
                  color: '#10B981',
                  bg: 'rgba(16, 185, 129, 0.12)',
                  consumed: carbConsumed,
                  target: carbTarget,
                  unit: 'g',
                },
                {
                  label: 'Yağ',
                  icon: 'water-outline' as const,
                  color: '#F59E0B',
                  bg: 'rgba(245, 158, 11, 0.12)',
                  consumed: fatConsumed,
                  target: fatTarget,
                  unit: 'g',
                },
              ];

              return (
                <>
                  {/* Kalori Özeti */}
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: 'rgba(255, 107, 53, 0.08)',
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 107, 53, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View>
                      <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>Günlük Kalori Hedefi</Text>
                      <Text style={{ color: '#FF6B35', fontSize: 24, fontWeight: '900', marginTop: 2 }}>
                        {tdee} <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8' }}>kcal</Text>
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>Bazal Metabolizma</Text>
                      <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                        {Math.round(bmr)} kcal
                      </Text>
                    </View>
                  </View>

                  {/* Makro Barları */}
                  {macros.map((macro, idx) => {
                    const pct = Math.min(macro.consumed / macro.target, 1);
                    const pctDisplay = Math.round(pct * 100);
                    return (
                      <View key={macro.label} style={{ marginBottom: idx < macros.length - 1 ? 16 : 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                          {/* İkon */}
                          <View
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              backgroundColor: macro.bg,
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Ionicons name={macro.icon} size={16} color={macro.color} />
                          </View>

                          {/* Etiket + Değer */}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                              <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '700' }}>{macro.label}</Text>
                              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                                <Text style={{ color: macro.color, fontWeight: '800' }}>{macro.consumed}{macro.unit}</Text>
                                {' / '}{macro.target}{macro.unit}
                                {'  '}
                                <Text style={{ color: pct >= 1 ? '#10B981' : macro.color }}>%{pctDisplay}</Text>
                              </Text>
                            </View>

                            {/* Progress Bar */}
                            <View
                              style={{
                                height: 7,
                                backgroundColor: 'rgba(71, 85, 105, 0.3)',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}
                            >
                              <View
                                style={{
                                  height: '100%',
                                  width: `${pctDisplay}%`,
                                  backgroundColor: macro.color,
                                  borderRadius: 4,
                                }}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </>
              );
            })()}
          </View>
        )}

        {/* ── Uyarı Notu ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <View
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.06)',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              borderWidth: 1,
              borderColor: 'rgba(99, 102, 241, 0.18)',
            }}
          >
            <Ionicons name="information-circle-outline" size={17} color="#818CF8" style={{ marginTop: 1 }} />
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 18 }}>
              Gösterilen kalori, makro ve BMI değerleri genel formüllere dayalı tahmindir. Kişisel sağlık kararları için bir uzman ile görüşünüz.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── MODAL: Profil Düzenle ── */}
      <Modal visible={editProfileVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 24,
                padding: 24,
                width: '100%',
                borderWidth: 1,
                borderColor: 'rgba(71, 85, 105, 0.4)',
              }}
            >
              <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800', marginBottom: 20 }}>
                Vücut Verilerini Düzenle
              </Text>

              {[
                { label: 'Boy (cm)', value: editHeight, setter: setEditHeight, placeholder: '175', keyboardType: 'numeric' as const },
                { label: 'Yaş', value: editAge, setter: setEditAge, placeholder: '28', keyboardType: 'numeric' as const },
              ].map(({ label, value, setter, placeholder, keyboardType }) => (
                <View key={label} style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
                  <TextInput
                    value={value}
                    onChangeText={setter}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    placeholderTextColor="#475569"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: '#F1F5F9',
                      fontSize: 15,
                      fontWeight: '700',
                      borderWidth: 1,
                      borderColor: 'rgba(71, 85, 105, 0.4)',
                    }}
                  />
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setEditProfileVisible(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: 'rgba(71, 85, 105, 0.2)',
                  }}
                >
                  <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 14 }}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: '#FF6B35',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL: Kilo Ekle ── */}
      <Modal visible={addWeightVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 24,
                padding: 24,
                width: '100%',
                borderWidth: 1,
                borderColor: 'rgba(71, 85, 105, 0.4)',
              }}
            >
              <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
                Kilo Ekle
              </Text>
              <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500', marginBottom: 20 }}>
                {formatDate(new Date())} — Bugün
              </Text>

              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                Kilonuz (kg)
              </Text>
              <TextInput
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                placeholder="Örn: 72.5"
                placeholderTextColor="#475569"
                autoFocus
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  color: '#F1F5F9',
                  fontSize: 22,
                  fontWeight: '800',
                  borderWidth: 1,
                  borderColor: 'rgba(71, 85, 105, 0.4)',
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setAddWeightVisible(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: 'rgba(71, 85, 105, 0.2)',
                  }}
                >
                  <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 14 }}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddWeight}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: '#FF6B35',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
