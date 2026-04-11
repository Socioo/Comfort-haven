import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { Text, View, Card } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/theme';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '../../types';
import * as Haptics from 'expo-haptics';
import { ResponsiveView } from '@/components/ResponsiveView';

export default function SignupScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { signUp, signInWithGoogle, signInWithApple, isSigningUp } = useAuth();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await signUp(name, email, phone, password, selectedRole);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      console.error('Signup error:', err);
      Alert.alert('Error', err.message || 'Failed to create account. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(selectedRole);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation is now handled by signInWithGoogle (e.g., to complete-profile or home)
    } catch (err) {
      console.error('Google sign in error:', err);
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple(selectedRole);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Apple sign in error:', err);
      Alert.alert('Error', 'Failed to sign in with Apple');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isTablet ? '10%' : 20 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveView maxWidth={600}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: themeColors.card }]} 
            onPress={() => router.back()}
          >
            <ArrowLeft color={themeColors.text} size={24} />
          </TouchableOpacity>

          <View style={[styles.header, { marginBottom: height * 0.04 }]}>
            <Text style={[styles.title, { fontSize: isTablet ? 40 : 32 }]}>Create Account</Text>
            <Text style={[styles.subtitle, { fontSize: isTablet ? 18 : 16 }]}>Join Comfort Haven today</Text>
          </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <User color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={themeColors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Mail color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={themeColors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Phone color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Enter your phone number"
                placeholderTextColor={themeColors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>I am a...</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleChip, 
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  selectedRole === 'user' && styles.roleChipSelected
                ]}
                onPress={() => setSelectedRole('user')}
              >
                <Text style={[
                  styles.roleChipText, 
                  { color: themeColors.text },
                  selectedRole === 'user' && styles.roleChipTextSelected
                ]}>
                  Guest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleChip, 
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  selectedRole === 'host' && styles.roleChipSelected
                ]}
                onPress={() => setSelectedRole('host')}
              >
                <Text style={[
                  styles.roleChipText, 
                  { color: themeColors.text },
                  selectedRole === 'host' && styles.roleChipTextSelected
                ]}>
                  Host
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Lock color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Create a password"
                placeholderTextColor={themeColors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff color={themeColors.textLight} size={20} />
                ) : (
                  <Eye color={themeColors.textLight} size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Lock color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={themeColors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff color={themeColors.textLight} size={20} />
                ) : (
                  <Eye color={themeColors.textLight} size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={isSigningUp}
          >
            <Text style={styles.signupButtonText}>
              {isSigningUp ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={handleGoogleSignIn}
            disabled={isSigningUp}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.appleButton, { backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000', marginTop: 12 }]}
              onPress={handleAppleSignIn}
              disabled={isSigningUp}
            >
              <Text style={[styles.appleButtonText, { color: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveView>
    </ScrollView>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleChipTextSelected: {
    color: '#FFFFFF',
  },
  signupButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
  },
  googleButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});