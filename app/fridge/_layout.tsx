import { Stack } from 'expo-router';

export default function FridgeLayout() {
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
        name="index"
        options={{ title: 'Buzdolabım' }}
      />
    </Stack>
  );
}
