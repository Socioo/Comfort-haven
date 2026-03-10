import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

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
  photoUrl?: string;
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
  signInWithGoogle: () => Promise<void>;
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

  const signIn = async (email: string, password: string) => {
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
  };

  const signUp = async (
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
  };

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      // This needs valid Google OAuth token logic, skipping for now as per original mock
      // Ideally should call authAPI.googleLogin
      console.warn("Google Sign In not implemented via API yet");
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
      await AsyncStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data;
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
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
