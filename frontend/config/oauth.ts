import { Platform } from 'react-native';

export const GOOGLE_CONFIG = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Use web/expo client ID for local dev
  redirectUri: 'https://auth.expo.io/@ahmadi/frontend', // Update with your actual expo username/slug
  scopes: ['profile', 'email'],
};

export const APPLE_CONFIG = {
  // Apple Sign-In mostly works out of the box with expo-apple-authentication on iOS
  // But you might need these for web/android fallback if you implement it later
  clientId: 'com.comfort.haven.service',
  redirectUri: 'https://your-backend-url.com/auth/apple/callback',
};
