import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Eksik bilgi', 'Lütfen e-posta ve şifreni gir.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Giriş başarısız', error);
    // Başarılıysa root layout yönlendirmeyi otomatik yapacak
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <Text style={{ color: '#F1F5F9', fontSize: 26, fontWeight: '800', marginBottom: 8 }}>
          Tekrar Hoş Geldin
        </Text>
        <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 32 }}>
          Devam etmek için giriş yap
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
            borderColor: 'rgba(71, 85, 105, 0.3)', marginBottom: 24,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Giriş Yap</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              Hesabın yok mu? <Text style={{ color: '#FF6B35', fontWeight: '700' }}>Kayıt ol</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}