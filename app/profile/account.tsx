import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─────────────── Statik Kullanıcı Verisi ───────────────
const STATIC_USER = {
  name: 'Ahmet Kaya',
  email: 'ahmet.kaya@email.com',
  phone: '+90 555 123 45 67',
  memberSince: 'Ocak 2024',
};

// ─────────────── Kırmızı Aksiyon Satırı ───────────────
function DangerRow({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={21} color="#EF4444" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#475569" />
    </TouchableOpacity>
  );
}

// ─────────────── Form Alanı ───────────────
function FormField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 13,
          borderWidth: 1,
          borderColor: 'rgba(71, 85, 105, 0.3)',
          gap: 12,
        }}
      >
        <Ionicons name={icon} size={17} color="#475569" />
        <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', flex: 1 }}>{value}</Text>
        <Ionicons name="lock-closed-outline" size={14} color="#334155" />
      </View>
    </View>
  );
}

// ─────────────── Ana Ekran ───────────────
export default function AccountScreen() {

  const handleSignOut = () => {
    Alert.alert(
      'Oturumu Kapat',
      'Oturumunuzu kapatmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Oturumu Kapat', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Hesabı Sil',
          style: 'destructive',
          onPress: () => {},
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* ── Üye Kartı ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 24,
            backgroundColor: '#1E293B',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#FF6B35',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>AK</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '800' }}>{STATIC_USER.name}</Text>
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
              Üye: {STATIC_USER.memberSince}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(255, 107, 53, 0.12)',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 53, 0.3)',
            }}
          >
            <Text style={{ color: '#FF6B35', fontSize: 11, fontWeight: '700' }}>Premium</Text>
          </View>
        </View>

        {/* ── Hesap Bilgileri ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              color: '#475569',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            Hesap Bilgileri
          </Text>

          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.3)',
            }}
          >
            <FormField label="Ad Soyad" value={STATIC_USER.name} icon="person-outline" />
            <FormField label="E-posta" value={STATIC_USER.email} icon="mail-outline" />
            <FormField label="Telefon" value={STATIC_USER.phone} icon="call-outline" />

            {/* Düzenle Butonu */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert('Bilgi', 'Hesap düzenleme özelliği yakında aktif olacak.')
              }
              style={{
                marginTop: 8,
                backgroundColor: 'rgba(255, 107, 53, 0.12)',
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 107, 53, 0.3)',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="pencil-outline" size={16} color="#FF6B35" />
              <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '700' }}>
                Bilgileri Düzenle
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Güvenlik ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <Text
            style={{
              color: '#475569',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 6,
              marginLeft: 4,
            }}
          >
            Güvenlik
          </Text>
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.3)',
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => Alert.alert('Bilgi', 'Şifre değiştirme özelliği yakında aktif olacak.')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: 'rgba(96, 165, 250, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="key-outline" size={21} color="#60A5FA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>Şifre Değiştir</Text>
                <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }}>
                  Hesap şifrenizi güncelleyin
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tehlikeli Bölge ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <Text
            style={{
              color: '#475569',
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 6,
              marginLeft: 4,
            }}
          >
            Oturum & Hesap
          </Text>
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.3)',
              overflow: 'hidden',
            }}
          >
            <DangerRow
              icon="log-out-outline"
              label="Oturumu Kapat"
              description="Hesabınızdan güvenli çıkış yapın"
              onPress={handleSignOut}
            />
            <View style={{ height: 1, backgroundColor: 'rgba(71, 85, 105, 0.2)', marginLeft: 74 }} />
            <DangerRow
              icon="trash-outline"
              label="Hesabı Sil"
              description="Tüm verileriniz kalıcı olarak silinir"
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        {/* ── Uyarı Notu ── */}
        <View style={{ marginHorizontal: 16, marginTop: 4 }}>
          <View
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.15)',
            }}
          >
            <Ionicons name="warning-outline" size={17} color="#EF4444" style={{ marginTop: 1 }} />
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 18 }}>
              Hesap silme işlemi geri alınamaz. Tüm alışveriş listeleriniz, sağlık verileriniz ve alerjen bilgileriniz kalıcı olarak silinir.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
