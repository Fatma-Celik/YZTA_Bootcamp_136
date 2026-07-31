import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CalorieWidget() {
  const targetCalorie = 3000;
  const consumedCalorie = 200;

  const radius = 34;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (consumedCalorie / targetCalorie) * circumference;

  const macros = [
    { label: 'PRO', pct: '75%' },
    { label: 'KARB', pct: '55%' },
    { label: 'YAĞ', pct: '12%' },
  ];

  return (
    <View style={styles.card}>
      {/* ── Sol: Hedef Metinleri + Makro Barlar ── */}
      <View style={styles.left}>
        <Text style={styles.sectionLabel}>Hedefler</Text>

        <View style={{ marginTop: 6 }}>
          <Text style={styles.goalTitle}>Kilo Verme</Text>
          <Text style={styles.goalSub}>Kas Kütlesi Koruma</Text>
        </View>

        {/* Makro Barları */}
        <View style={styles.macroContainer}>
          {macros.map((m) => (
            <View key={m.label} style={styles.macroRow}>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: m.pct }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Sağ: Dairesel Progress Bar ── */}
      <View style={styles.right}>
        {/* Daire arka planı */}
        <View style={styles.circleWrapper}>
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
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress */}
            <Circle
              cx="45"
              cy="45"
              r={radius}
              stroke="#FFFFFF"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </Svg>

          {/* Ortadaki metin */}
          <View style={styles.circleTextWrapper}>
            <Text style={styles.calorieBig}>{consumedCalorie}</Text>
            <Text style={styles.calorieSmall}>/ {targetCalorie} kcal</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '95%',
    height: 175,
    marginTop: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Hafif gölge
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  // ── Sol ──
  left: {
    flex: 1,
    paddingRight: 12,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  goalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  goalSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  macroContainer: {
    marginTop: 12,
    gap: 6,
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
    width: 34,          // "KARB" için yeterli genişlik
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
  // ── Sağ ──
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