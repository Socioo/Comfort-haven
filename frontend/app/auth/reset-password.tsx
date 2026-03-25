import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/theme';
import api from '@/services/api';
import * as Haptics from 'expo-haptics';
import NotificationModal, { NotificationType } from '@/components/NotificationModal';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
    onClose?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (type: NotificationType, title: string, message: string, onClose?: () => void) => {
    setNotification({ isOpen: true, type, title, message, onClose });
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      showAlert('error', 'Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('error', 'Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('error', 'Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert(
        'success',
        'Success',
        'Your password has been reset successfully. Please login with your new password.',
        () => router.replace('/auth/login' as any)
      );
    } catch (err: any) {
      console.error('Reset password error:', err);
      showAlert('error', 'Error', err.response?.data?.message || 'Failed to reset password. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: themeColors.card }]} 
          onPress={() => router.back()}
        >
          <ArrowLeft color={themeColors.text} size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {email} and your new password.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Key color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="6-digit code"
                placeholderTextColor={themeColors.textLight}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Lock color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Enter new password"
                placeholderTextColor={themeColors.textLight}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
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
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Lock color={themeColors.textLight} size={20} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={themeColors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.primary }]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <NotificationModal 
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => {
          setNotification({ ...notification, isOpen: false });
          if (notification.onClose) notification.onClose();
        }}
      />
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
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
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
