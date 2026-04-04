import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export type UserRole = "user" | "host" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  phone?: string;
  // For UI fallbacks
  firstName?: string;
  lastName?: string;
  photoUrl?: string; // This will map to profileImage from backend
  status?: 'active' | 'inactive';
  notifications?: {
    newProperties: boolean;
    newBookings: boolean;
    marketing: boolean;
    propertyApproval: boolean;
    verificationStatus: boolean;
  };
  paystackSubaccountCode?: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

interface AuthContextType {
  user: User | null;
  token?: string | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: UserRole,
  ) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("access_token");
      const userData = await AsyncStorage.getItem("user");
      if (storedToken && userData) {
        setToken(storedToken);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    setIsSigningIn(true);
    try {
      const response = await authAPI.login({ email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      // Normalize token names for safety
      const at = accessToken || response.data.access_token;
      const rt = refreshToken || response.data.refresh_token;

      // Save to AsyncStorage
      await AsyncStorage.setItem("access_token", at);
      await AsyncStorage.setItem("refresh_token", rt);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setToken(at);
      setUser(userData);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signUp = useCallback(async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: UserRole,
  ) => {
    setIsSigningUp(true);
    try {
      const response = await authAPI.register({
        name,
        email,
        phone,
        password,
        role,
      });
      const { accessToken, refreshToken, user: userData } = response.data;

      // Ensure accessToken and refreshToken names match frontend expectations
      const at = accessToken || response.data.access_token;
      const rt = refreshToken || response.data.refresh_token;

      await AsyncStorage.setItem("access_token", at);
      await AsyncStorage.setItem("refresh_token", rt);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setToken(at);
      setUser(userData);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setIsSigningUp(false);
    }
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({
      // @ts-ignore - still needed for some Expo versions to force proxy
      useProxy: true,
      scheme: 'frontend',
    }),
  });

  useEffect(() => {
    if (request) {
      console.log("Google Auth Redirect URI:", request.redirectUri);
    }
  }, [request]);

  const signInWithGoogle = useCallback(async (role?: UserRole) => {
    const isConfigured = 
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID && 
      !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.includes('provide') &&
      !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.includes('not-configured');

    if (!isConfigured) {
      alert("Google Client IDs are not configured. Please see the walkthrough for setup instructions and update your .env file.");
      setIsSigningIn(false);
      return;
    }
    setIsSigningIn(true);
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { authentication } = result;
        
        // Fetch user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${authentication?.accessToken}` },
        });
        
        const googleUser = await userInfoResponse.json();
        
        // Send to our backend
        const response = await authAPI.googleLogin({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          profileImage: googleUser.picture,
          role: role,
        });

        const { accessToken, refreshToken, user: userData } = response.data;
        
        // Normalize and save
        const at = accessToken || response.data.access_token;
        const rt = refreshToken || response.data.refresh_token;

        await AsyncStorage.setItem("access_token", at);
        await AsyncStorage.setItem("refresh_token", rt);
        await AsyncStorage.setItem("user", JSON.stringify(userData));

        setToken(at);
        setUser(userData);

        // Check if profile is incomplete (missing phone number)
        if (!userData.phone) {
          const { router } = require("expo-router");
          router.replace("/auth/complete-profile");
        }
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    // 1. Clear state IMMEDIATELY for instant UI response
    setToken(null);
    setUser(null);

    // 2. Clear storage concurrently
    const clearStorage = async () => {
      try {
        await AsyncStorage.multiRemove([
          "access_token",
          "refresh_token",
          "user"
        ]);
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
    };

    // 3. Call backend logout in background
    const callBackendLogout = async () => {
      try {
        await authAPI.logout();
      } catch (error: any) {
        // Ignore errors during logout (like 401) as we've already cleared local state
        if (error.response?.status !== 401) {
          console.log("Background sign out API call info:", error.message || error);
        }
      }
    };

    // Execute storage clearing and optional backend call
    await Promise.all([
      clearStorage(),
      callBackendLogout()
    ]);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data;
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const authValue = useMemo(() => ({
    user,
    token,
    isLoading,
    isSigningIn,
    isSigningUp,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshUser,
    updateUser,
  }), [
    user, 
    token, 
    isLoading, 
    isSigningIn, 
    isSigningUp, 
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOut, 
    refreshUser, 
    updateUser
  ]);

  return (
    <AuthContext.Provider
      value={authValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
