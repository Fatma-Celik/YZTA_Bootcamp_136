import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MyMealsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* İkon Container */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(245, 158, 11, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="restaurant-outline" size={40} color="#F59E0B" />
        </View>

        <Text
          style={{
            color: '#F1F5F9',
            fontSize: 20,
            fontWeight: '800',
            letterSpacing: -0.3,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Öğünlerim
        </Text>

        <Text
          style={{
            color: '#64748B',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center',
            lineHeight: 21,
            marginBottom: 32,
          }}
        >
          Günlük öğünlerinizi takip edin ve beslenme alışkanlıklarınızı kontrol altına alın.
        </Text>

        {/* Yakında badge */}
        <View
          style={{
            backgroundColor: 'rgba(255, 107, 53, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(255, 107, 53, 0.3)',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="time-outline" size={16} color="#FF6B35" />
          <Text
            style={{
              color: '#FF6B35',
              fontSize: 13,
              fontWeight: '700',
            }}
          >
            Çok Yakında Aktif Olacak
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
