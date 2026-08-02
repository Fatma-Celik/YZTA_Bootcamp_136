import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RecipeFlowProvider } from '@/hooks/useRecipeFlow';
import '../global.css'
import AnimatedLoadingScreen from '@/components/AnimatedLoadingScreen';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AlertProvider } from '@/contexts/AlertContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AlertProvider>
          <NotificationProvider>
            <AppThemeProvider>
              <RootLayoutNav />
            </AppThemeProvider>
          </NotificationProvider>
        </AlertProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { isDark, colors } = useTheme();
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // React Navigation temasını uygulamanın aktif temasıyla eşitle
  const navigationTheme = useMemo(() => ({
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      border: colors.cardBorder,
      text: colors.textPrimary,
      primary: colors.primary,
      notification: colors.primary,
    },
  }), [isDark, colors]);

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        router.replace('/(tabs)');
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [session, loading, segments]);

  if (loading) {
    return <AnimatedLoadingScreen />;
  }

  return (
    <RecipeFlowProvider>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
        <ThemeProvider value={navigationTheme}>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="scanner" options={{ headerShown: false }} />
              <Stack.Screen name="fridge" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </RecipeFlowProvider>
  );
}
