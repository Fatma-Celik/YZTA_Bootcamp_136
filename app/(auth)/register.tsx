// app/(auth)/register.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldur.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Şifreler uyuşmuyor', 'Girdiğin şifreler aynı değil.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Zayıf şifre', 'Şifre en az 6 karakter olmalı.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Kayıt başarısız', error);
    } else {
      Alert.alert(
        'Kayıt başarılı',
        'E-postana gönderilen doğrulama bağlantısına tıklayarak hesabını onayla.',
        [{ text: 'Tamam', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <Text style={{ color: '#F1F5F9', fontSize: 26, fontWeight: '800', marginBottom: 8 }}>
          Hesap Oluştur
        </Text>
        <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 32 }}>
          Başlamak için bilgilerini gir
        </Text>

        <TextInput
          placeholder="E-posta"
          placeholderTextColor="#64748B"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            backgroundColor: '#1E293B', borderRadius: 14, paddingHorizontal: 16,
            paddingVertical: 14, color: '#F1F5F9', fontSize: 15, borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)', marginBottom: 14,
          }}
        />
        <TextInput
          placeholder="Şifre"
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: '#1E293B', borderRadius: 14, paddingHorizontal: 16,
            paddingVertical: 14, color: '#F1F5F9', fontSize: 15, borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)', marginBottom: 14,
          }}
        />
        <TextInput
          placeholder="Şifre (Tekrar)"
          placeholderTextColor="#64748B"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={{
            backgroundColor: '#1E293B', borderRadius: 14, paddingHorizontal: 16,
            paddingVertical: 14, color: '#F1F5F9', fontSize: 15, borderWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)', marginBottom: 24,
          }}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Kayıt Ol</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              Zaten hesabın var mı? <Text style={{ color: '#FF6B35', fontWeight: '700' }}>Giriş yap</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}