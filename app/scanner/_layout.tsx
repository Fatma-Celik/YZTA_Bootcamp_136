import { Stack } from 'expo-router';

export default function ScannerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F1F5F9',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0F172A' },
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
    </Stack>
  );
}
