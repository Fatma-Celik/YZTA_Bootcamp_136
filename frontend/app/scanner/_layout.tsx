import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ScannerLayout() {
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
      <Stack.Screen
        name="ingredient-edit"
        options={{ title: 'Malzeme Düzenle' }}
      />
      <Stack.Screen
        name="recipe-details"
        options={{ title: 'Tarif Detayları' }}
      />
      <Stack.Screen
        name="recipe-results"
        options={{ title: 'Tarifler' }}
      />
      <Stack.Screen
        name="macro-results"
        options={{ title: 'Besin Değerleri' }}
      />
      <Stack.Screen
        name="recipe-cooking"
        options={{ title: 'Tarif Modu' , headerShown:false }}
      />
    </Stack>
  );
}
