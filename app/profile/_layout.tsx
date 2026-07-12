import { Stack } from 'expo-router';

export default function ProfileLayout() {
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
      <Stack.Screen name="allergens" options={{ title: 'Alerjenlerim' }} />
      <Stack.Screen name="health" options={{ title: 'Sağlığım' }} />
      <Stack.Screen name="preferences" options={{ title: 'Tercihler' }} />
      <Stack.Screen name="account" options={{ title: 'Hesap' }} />
    </Stack>
  );
}
