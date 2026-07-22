import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { isValidEmail, isValidPasswordStrict } from '@/utils/validation';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldur.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Geçersiz e-posta', 'Lütfen geçerli bir e-posta adresi gir.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Şifreler uyuşmuyor', 'Girdiğin şifreler aynı değil.');
      return;
    }
    const passwordCheck = isValidPasswordStrict(password);
    if (!passwordCheck.valid) {
      Alert.alert('Zayıf şifre', passwordCheck.message!);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim()); // artık doğru: fullName gönderiliyor
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.statusBar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
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
          Hesap Oluştur
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
          Başlamak için bilgilerini gir
        </Text>

        <TextInput
          placeholder="Ad Soyad"
          placeholderTextColor={colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
          style={{
            backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16,
            paddingVertical: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1,
            borderColor: colors.cardBorder, marginBottom: 14,
          }}
        />
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
            borderColor: colors.cardBorder, marginBottom: 14,
          }}
        />
        <TextInput
          placeholder="Şifre (Tekrar)"
          placeholderTextColor={colors.textMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={{
            backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16,
            paddingVertical: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1,
            borderColor: colors.cardBorder, marginBottom: 24,
          }}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Kayıt Ol</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              Zaten hesabın var mı? <Text style={{ color: colors.primary, fontWeight: '700' }}>Giriş yap</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
