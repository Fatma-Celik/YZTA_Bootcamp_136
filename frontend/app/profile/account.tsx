import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { confirmAction } from '@/utils/confirmAction';

// ─────────────── Kırmızı Aksiyon Satırı ───────────────
function DangerRow({
  icon,
  label,
  description,
  onPress,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={loading}
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
        {loading ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <Ionicons name={icon} size={21} color="#EF4444" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#475569" />
    </TouchableOpacity>
  );
}

// ─────────────── Form Alanı (salt okunur) ───────────────
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

// ─────────────── Düzenlenebilir Form Alanı ───────────────
function EditableField({
  label,
  value,
  onChangeText,
  icon,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'numeric';
}) {
  const TextInput = require('react-native').TextInput;
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
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: 'rgba(255, 107, 53, 0.3)',
          gap: 12,
        }}
      >
        <Ionicons name={icon} size={17} color="#FF6B35" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor="#475569"
          style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', flex: 1, paddingVertical: 10 }}
        />
      </View>
    </View>
  );
}

// ─────────────── Ana Ekran ───────────────
export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [fullName, setFullName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setHeightCm(profile.height_cm != null ? String(profile.height_cm) : '');
      setWeightKg(profile.weight_kg != null ? String(profile.weight_kg) : '');
    }
  }, [profile]);

  const email = user?.email ?? '—';
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  const initials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
    });
    setSaving(false);
    if (error) Alert.alert('Hata', error);
    else {
      setEditing(false);
      Alert.alert('Başarılı', 'Bilgilerin güncellendi.');
    }
  };

  const handleSignOut = () => {
    confirmAction(
      'Oturumu Kapat',
      'Oturumunuzu kapatmak istediğinize emin misiniz?',
      async () => {
        setSigningOut(true);
        await signOut();
      },
      'Oturumu Kapat'
    );
  };

  const handleDeleteAccount = () => {
    confirmAction(
      'Hesabı Sil',
      'Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.',
      () => {
        // Hesap silme işlemi henüz aktif değil
        Alert.alert('Bilgi', 'Hesap silme özelliği yakında aktif olacak.');
      },
      'Evet, Hesabı Sil'
    );
  };

  // ── Yükleniyor ──
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </SafeAreaView>
    );
  }

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
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '800' }}>{displayName}</Text>
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
              {email}
            </Text>
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
            {editing ? (
              <>
                <EditableField label="Ad Soyad" value={fullName} onChangeText={setFullName} icon="person-outline" />
                <EditableField label="Boy (cm)" value={heightCm} onChangeText={setHeightCm} icon="resize-outline" keyboardType="numeric" />
                <EditableField label="Kilo (kg)" value={weightKg} onChangeText={setWeightKg} icon="barbell-outline" keyboardType="numeric" />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setEditing(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 13,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: 'rgba(100, 116, 139, 0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(71, 85, 105, 0.3)',
                    }}
                  >
                    <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '700' }}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSave}
                    disabled={saving}
                    style={{
                      flex: 1,
                      paddingVertical: 13,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: '#FF6B35',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Kaydet</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <FormField label="Ad Soyad" value={displayName} icon="person-outline" />
                <FormField label="E-posta" value={email} icon="mail-outline" />
                <FormField
                  label="Boy / Kilo"
                  value={`${profile?.height_cm ?? '—'} cm / ${profile?.weight_kg ?? '—'} kg`}
                  icon="body-outline"
                />

                {/* Düzenle Butonu */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setEditing(true)}
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
              </>
            )}
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

        {/* ── Oturum & Hesap ── */}
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
              loading={signingOut}
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