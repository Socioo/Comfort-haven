import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { GOOGLE_CONFIG, APPLE_CONFIG } from '@/config/oauth'; // Assumes path alias @
import { authAPI } from '@/services/api';

export class OAuthService {
  // Google OAuth
  static async signInWithGoogle(): Promise<any> {
    try {
      // In a real hook, this would be useAuthRequest, but for a service class 
      // where we want to trigger it imperatively, we might need a different approach 
      // or use a context/hook wrapper. For now, since it was previously a class, 
      // let's keep it as is but note that Google.useAuthRequest is a hook.
      
      // If we are in a component, we use the hook. In a service, we'd need the 
      // session to be initiated.
      
      throw new Error('Google Sign-In should be triggered via the useAuthRequest hook in the component.');
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      throw error;
    }
  }

  // Apple OAuth (iOS only)
  static async signInWithApple(): Promise<any> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    try {
      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Start Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Extract name from fullName object
      const name = credential.fullName 
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : 'Apple User';

      // Send to your backend
      const backendResponse = await authAPI.appleLogin({
        email: credential.email || '', // Email might be null on subsequent logins
        name: name,
        appleId: credential.user, // Unique user identifier
      });

      return {
        success: true,
        data: backendResponse.data,
      };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple Sign-In was cancelled');
      }
      console.error('Apple OAuth error:', error);
      throw error;
    }
  }

  // Facebook OAuth (optional)
  static async signInWithFacebook(): Promise<any> {
    throw new Error('Facebook OAuth not implemented');
  }
}