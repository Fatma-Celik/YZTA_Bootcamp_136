import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { confirmAction } from '@/utils/confirmAction';

function EditableField({
  label, value, onChangeText, icon, keyboardType,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  icon: keyof typeof Ionicons.glyphMap; keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.3)', gap: 12,
      }}>
        <Ionicons name={icon} size={17} color="#475569" />
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

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  const [editing, setEditing] = useState(false);
  const [saving, setSigningOutState] = useState(false); // (bkz. not aşağıda)
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
    const { error } = await updateProfile({
      full_name: fullName,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
    });
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['bottom']}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>

        {/* Üye Kartı */}
        <View style={{
          marginHorizontal: 16, marginBottom: 24, backgroundColor: '#1E293B', borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: 'rgba(71, 85, 105, 0.3)',
          flexDirection: 'row', alignItems: 'center', gap: 16,
        }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B35',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '800' }}>{displayName}</Text>
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 2 }}>{email}</Text>
          </View>
        </View>

        {/* Hesap Bilgileri */}
        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <Text style={{
            color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10, marginLeft: 4,
          }}>
            Hesap Bilgileri
          </Text>

          <View style={{
            backgroundColor: '#1E293B', borderRadius: 18, padding: 16,
            borderWidth: 1, borderColor: 'rgba(71, 85, 105, 0.3)',
          }}>
            {editing ? (
              <>
                <EditableField label="Ad Soyad" value={fullName} onChangeText={setFullName} icon="person-outline" />
                <EditableField label="Boy (cm)" value={heightCm} onChangeText={setHeightCm} icon="resize-outline" keyboardType="numeric" />
                <EditableField label="Kilo (kg)" value={weightKg} onChangeText={setWeightKg} icon="barbell-outline" keyboardType="numeric" />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => setEditing(false)}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(100,116,139,0.15)' }}
                  >
                    <Text style={{ color: '#94A3B8', fontWeight: '700' }}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: '#FF6B35' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Ad Soyad</Text>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', marginBottom: 14 }}>{displayName}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>E-posta</Text>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', marginBottom: 14 }}>{email}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Boy / Kilo</Text>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', marginBottom: 14 }}>
                  {profile?.height_cm ?? '—'} cm / {profile?.weight_kg ?? '—'} kg
                </Text>

                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  style={{
                    marginTop: 8, backgroundColor: 'rgba(255, 107, 53, 0.12)', borderRadius: 14,
                    paddingVertical: 13, alignItems: 'center', borderWidth: 1,
                    borderColor: 'rgba(255, 107, 53, 0.3)', flexDirection: 'row',
                    justifyContent: 'center', gap: 8,
                  }}
                >
                  <Ionicons name="pencil-outline" size={16} color="#FF6B35" />
                  <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '700' }}>Bilgileri Düzenle</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Oturum */}
        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <View style={{
            backgroundColor: '#1E293B', borderRadius: 18, borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)', overflow: 'hidden',
          }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleSignOut}
              disabled={signingOut}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(239, 68, 68, 0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {signingOut
                  ? <ActivityIndicator size="small" color="#EF4444" />
                  : <Ionicons name="log-out-outline" size={21} color="#EF4444" />}
              </View>
              <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700', flex: 1 }}>Oturumu Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}