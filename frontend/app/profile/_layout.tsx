import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="allergens" options={{ title: 'Alerjenlerim' }} />
      <Stack.Screen name="health" options={{ title: 'Sağlığım' }} />
      <Stack.Screen name="preferences" options={{ title: 'Tercihler' }} />
      <Stack.Screen name="account" options={{ title: 'Hesap' }} />
      <Stack.Screen name="my-meals" options={{ title: 'Öğünlerim', headerShown:false }} />
      <Stack.Screen name="favorite-recipes" options={{ title: 'Favori Tariflerim' }} />
    </Stack>
  );
}
