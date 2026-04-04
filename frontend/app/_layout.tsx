import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Platform } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { FavoritesProvider } from '@/contexts/favorites';
import { PropertiesProvider } from '@/contexts/properties';
import { BookingsProvider } from '@/contexts/bookings';
import { AppThemeProvider } from '@/contexts/theme';
import { NotificationsProvider } from '@/contexts/notifications';
import Colors from '@/constants/Colors';
import { settingsAPI } from '@/services/api';

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

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <RootLayoutNav />
    </AppThemeProvider>
  );
}

import { StatusBar } from 'expo-status-bar';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const ComfortHavenTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: Colors.primary,
      background: themeColors.background,
      card: themeColors.card,
      text: themeColors.text,
      border: themeColors.border,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ThemeProvider value={ComfortHavenTheme}>
        <AuthProvider>
          <AuthLoader>
            <MaintenanceLoader>
              <FavoritesProvider>
                <PropertiesProvider>
                  <BookingsProvider>
                  <NotificationsProvider>
                  <Stack
                    screenOptions={{
                      headerStyle: {
                        backgroundColor: themeColors.card,
                      },
                      headerTintColor: Colors.primary,
                      headerTitleStyle: {
                        color: themeColors.text,
                      },
                      contentStyle: {
                        backgroundColor: themeColors.background,
                      },
                    }}
                  >
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
                    <Stack.Screen
                      name="messages/index"
                      options={{ 
                        title: 'Messages',
                        headerBackTitle: "",
                      }}
                    />
                    <Stack.Screen
                      name="messages/[userId]"
                      options={{ 
                        title: 'Chat',
                        headerBackTitle: "",
                      }}
                    />
                    <Stack.Screen
                      name="ai-chat"
                      options={{ presentation: 'modal', title: 'AI Assistant' }}
                    />
                  </Stack>
                </NotificationsProvider>
                </BookingsProvider>
              </PropertiesProvider>
            </FavoritesProvider>
          </MaintenanceLoader>
          </AuthLoader>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}

import { ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

function MaintenanceLoader({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkMaintenance();
  }, []);

  const checkMaintenance = async () => {
    try {
      const response = await settingsAPI.getByKey('maintenance_mode');
      setIsMaintenance(response.data?.value === 'true');
    } catch (err) {
      console.error('Error checking maintenance mode:', err);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isMaintenance) {
    return (
      <View style={styles.maintenanceContainer}>
        <FontAwesome name="wrench" size={64} color={Colors.primary} />
        <Text style={styles.maintenanceTitle}>Under Maintenance</Text>
        <Text style={styles.maintenanceText}>
          Comfort Haven is currently undergoing scheduled maintenance. Please check back later.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={checkMaintenance}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  maintenanceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  maintenanceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  maintenanceText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
