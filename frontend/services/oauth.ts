// // FRONTEND FILE: Create /services/oauth.ts
// import * as AuthSession from 'expo-auth-session';
// import * as Google from 'expo-auth-session/providers/google';
// import * as AppleAuthentication from 'expo-apple-authentication';
// import { Platform } from 'react-native';
// import { GOOGLE_CONFIG, APPLE_CONFIG } from '@/config/oauth';
// import { authAPI } from '@/services/api';

// export class OAuthService {
//   // Google OAuth
//   static async signInWithGoogle(): Promise<any> {
//     try {
//       const [request, response, promptAsync] = Google.useAuthRequest({
//         clientId: Platform.select({
//           ios: GOOGLE_CONFIG.iosClientId,
//           android: GOOGLE_CONFIG.androidClientId,
//           default: GOOGLE_CONFIG.expoClientId,
//         }),
//         redirectUri: GOOGLE_CONFIG.redirectUri,
//         scopes: GOOGLE_CONFIG.scopes,
//       });

//       if (!request) {
//         throw new Error('Google auth request not ready');
//       }

//       const result = await promptAsync();
      
//       if (result.type === 'success') {
//         const { authentication } = result;
        
//         if (!authentication?.accessToken) {
//           throw new Error('No access token received');
//         }

//         // Send token to your backend
//         const backendResponse = await authAPI.googleLogin(authentication.accessToken);
        
//         return {
//           success: true,
//           data: backendResponse.data,
//         };
//       } else {
//         throw new Error('Google sign-in cancelled');
//       }
//     } catch (error: any) {
//       console.error('Google OAuth error:', error);
//       throw error;
//     }
//   }

//   // Apple OAuth (iOS only)
//   static async signInWithApple(): Promise<any> {
//     if (Platform.OS !== 'ios') {
//       throw new Error('Apple Sign-In is only available on iOS');
//     }

//     try {
//       // Check if Apple Sign-In is available
//       const isAvailable = await AppleAuthentication.isAvailableAsync();
//       if (!isAvailable) {
//         throw new Error('Apple Sign-In is not available on this device');
//       }

//       // Start Apple Sign-In
//       const credential = await AppleAuthentication.signInAsync({
//         requestedScopes: [
//           AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
//           AppleAuthentication.AppleAuthenticationScope.EMAIL,
//         ],
//       });

//       // Send to your backend
//       const backendResponse = await authAPI.appleLogin({
//         identityToken: credential.identityToken,
//         user: credential.user,
//         fullName: credential.fullName,
//         email: credential.email,
//       });

//       return {
//         success: true,
//         data: backendResponse.data,
//       };
//     } catch (error: any) {
//       if (error.code === 'ERR_CANCELED') {
//         throw new Error('Apple Sign-In was cancelled');
//       }
//       console.error('Apple OAuth error:', error);
//       throw error;
//     }
//   }

//   // Facebook OAuth (optional)
//   static async signInWithFacebook(): Promise<any> {
//     // Similar implementation for Facebook
//     // You'll need to install and configure Facebook SDK
//     throw new Error('Facebook OAuth not implemented');
//   }

//   // Universal OAuth handler
//   static async handleOAuthRedirect(url: string): Promise<void> {
//     // Handle OAuth redirects
//     const parsedUrl = new URL(url);
    
//     if (parsedUrl.pathname.includes('/oauth/google')) {
//       // Handle Google redirect
//       const params = new URLSearchParams(parsedUrl.search);
//       const code = params.get('code');
      
//       if (code) {
//         // Exchange code for token
//         const response = await authAPI.googleExchangeCode(code);
//         return response.data;
//       }
//     }
    
//     throw new Error('Invalid OAuth redirect');
//   }
// }