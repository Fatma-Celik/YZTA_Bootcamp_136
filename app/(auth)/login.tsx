import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { isValidEmail } from '@/utils/validation';

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const { colors, isDark } = useTheme();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Eksik bilgi', 'Lütfen e-posta ve şifreni gir.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Geçersiz e-posta', 'Lütfen geçerli bir e-posta adresi gir.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Giriş başarısız', error);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) Alert.alert('Google girişi başarısız', error);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.statusBar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        {/* ── Logo + İsim (büyütülmüş, ortalanmış) ── */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={{ width: 110, height: 110, marginBottom: 14 }}
            resizeMode="contain"
          />
          <Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: '900', letterSpacing: -0.6 }}>
            Nex<Text style={{ color: colors.primary }}>Bite</Text>
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: 4 }}>
            Akıllı Mutfak Asistanı
          </Text>
        </View>

        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>
          Tekrar Hoş Geldin
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
          Devam etmek için giriş yap
        </Text>

        <TextInput
          placeholder="E-posta"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16,
            paddingVertical: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1,
            borderColor: colors.cardBorder, marginBottom: 14,
          }}
        />
        <TextInput
          placeholder="Şifre"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16,
            paddingVertical: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1,
            borderColor: colors.cardBorder, marginBottom: 24,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Giriş Yap</Text>}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginHorizontal: 12 }}>veya</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
        </View>

        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, gap: 10,
            opacity: googleLoading ? 0.7 : 1, borderWidth: isDark ? 0 : 1, borderColor: '#E2E8F0',
          }}
        >
          {googleLoading ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <>
              <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={{ width: 18, height: 18 }} />
              <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '700' }}>Google ile Giriş Yap</Text>
            </>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              Hesabın yok mu? <Text style={{ color: colors.primary, fontWeight: '700' }}>Kayıt ol</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
