import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export type UserRole = 'user' | 'host' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token?: string | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, phone: string, password: string, role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      const storedToken = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user');
      if (storedToken && userData) {
        setToken(storedToken);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsSigningIn(true);
    try {
      // Mock user for now
      // const response = await authAPI.login(email, password);

      // const { access_token, user: userData } = response.data;

      // // Format user to match your interface
      // const formattedUser: User = {
      //   id: userData.id || userData._id,
      //   email: userData.email,
      //   name: userData.name || `${userData.firstName} ${userData.lastName}`,
      //   firstName: userData.firstName || userData.name?.split(' ')[0],
      //   lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
      //   role: userData.role || 'user',
      //   phone: userData.phone,
      //   photoUrl: userData.photoUrl || userData.profileImage,
      // };
      
      // // Save to AsyncStorage
      // await AsyncStorage.setItem('access_token', access_token);
      // await AsyncStorage.setItem('user', JSON.stringify(formattedUser));
      
      // // Update state
      // setToken(access_token);
      // setUser(formattedUser);

      const mockUser: User = {
        id: '1',
        email: email,
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        phone: '+2348123456789',
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUp = async (name: string, email: string, phone: string, password: string, role: UserRole) => {
    setIsSigningUp(true);
    try {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        role,
        phone,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsSigningUp(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      const googleUser: User = {
        id: 'google-1',
        email: 'google@example.com',
        name: 'Google User',
        firstName: 'Google',
        lastName: 'User',
        role: 'user',
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(googleUser));
      setUser(googleUser);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};