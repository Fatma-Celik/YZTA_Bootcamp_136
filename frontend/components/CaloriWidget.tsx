import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useDailyMacros } from '@/hooks/useDailyMacros';
import { useFocusEffect, useRouter } from 'expo-router';

export default function CalorieWidget() {
  const router = useRouter();
  const { consumed, targets, refetch } = useDailyMacros();

  // Ekran her odağa geldiğinde veriyi yenile
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const targetCalorie = targets.calories || 2000;
  const consumedCalorie = consumed.calories || 0;
  const isExceeded = consumedCalorie > targetCalorie;

  const radius = 34;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.min(consumedCalorie / targetCalorie, 1) * circumference;

  const proPct = targets.protein > 0 ? `${Math.min(Math.round((consumed.protein / targets.protein) * 100), 100)}%` : '0%';
  const carbPct = targets.carbs > 0 ? `${Math.min(Math.round((consumed.carbs / targets.carbs) * 100), 100)}%` : '0%';
  const fatPct = targets.fat > 0 ? `${Math.min(Math.round((consumed.fat / targets.fat) * 100), 100)}%` : '0%';
  const fiberPct = (targets.fiber || 28) > 0 ? `${Math.min(Math.round(((consumed.fiber || 0) / (targets.fiber || 28)) * 100), 100)}%` : '0%';

  const macros = [
    { label: 'PRO', pct: proPct },
    { label: 'KARB', pct: carbPct },
    { label: 'YAĞ', pct: fatPct },
    { label: 'LİF', pct: fiberPct },
  ];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isExceeded && {
          backgroundColor: '#B91C1C',
          borderWidth: 2,
          borderColor: '#EF4444',
          shadowColor: '#EF4444',
        },
      ]}
      activeOpacity={0.88}
      onPress={() => router.push('/profile/health')}
    >
      {/* ── Sol: Hedef Metinleri + Makro Barlar ── */}
      <View style={styles.left}>
        <View style={{ marginTop: 4 }}>
          {isExceeded ? (
            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 2 }}>
              <Text style={{ color: '#FCA5A5', fontSize: 10, fontWeight: '800' }}>⚠️ HEDEF AŞILDI</Text>
            </View>
          ) : null}
          <Text style={styles.goalTitle}>{isExceeded ? 'Kalori Aşıldı!' : 'Kilo Verme'}</Text>
          <Text style={styles.goalSub}>{isExceeded ? 'Kalan öğünlerinize dikkat edin' : 'Kas Kütlesi Koruma'}</Text>
        </View>

        {/* Makro Barları */}
        <View style={styles.macroContainer}>
          {macros.map((m) => (
            <View key={m.label} style={styles.macroRow}>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: m.pct as any }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Sağ: Dairesel Progress Bar ── */}
      <View style={styles.right}>
        <View style={[styles.circleWrapper, isExceeded && { borderColor: '#FCA5A5' }]}>
          <Svg
            width={140}
            height={140}
            viewBox="0 0 90 90"
            style={{ transform: [{ rotate: '-90deg' }] }}
          >
            {/* Track */}
            <Circle
              cx="45"
              cy="45"
              r={radius}
              stroke={isExceeded ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.2)'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress */}
            <Circle
              cx="45"
              cy="45"
              r={radius}
              stroke={isExceeded ? '#FEF2F2' : '#FFFFFF'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </Svg>

          {/* Ortadaki metin */}
          <View style={styles.circleTextWrapper}>
            <Text style={[styles.calorieBig, isExceeded && { color: '#FEF2F2' }]}>{consumedCalorie}</Text>
            <Text style={[styles.calorieSmall, isExceeded && { color: '#FCA5A5' }]}>/ {targetCalorie} kcal</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '95%',
    height: 185,
    marginTop: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  goalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  goalSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  macroContainer: {
    marginTop: 8,
    gap: 4,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    width: 34,
    letterSpacing: 0.3,
  },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  right: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  circleTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieBig: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  calorieSmall: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: -1,
  },
});