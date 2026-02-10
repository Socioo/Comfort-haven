import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/auth';
import { FavoritesProvider } from '@/contexts/favorites';
import { PropertiesProvider } from '@/contexts/properties';
import { BookingsProvider } from '@/contexts/bookings';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FavoritesProvider>
          <PropertiesProvider>
            <BookingsProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="auth/login"
                  options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                  name="auth/signup"
                  options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                  name="property/[id]"
                  options={{ presentation: 'modal', title: 'Property Details' }}
                />
                <Stack.Screen
                  name="booking/[id]"
                  options={{ presentation: 'modal', title: 'Booking' }}
                />
                <Stack.Screen
                  name="host/[id]"
                  options={{ presentation: 'modal', title: 'Host Details' }}
                />
                <Stack.Screen
                  name="favorites/index"
                  options={{ presentation: 'modal', title: 'Favorites' }}
                />
              </Stack>
            </BookingsProvider>
          </PropertiesProvider>
        </FavoritesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}


