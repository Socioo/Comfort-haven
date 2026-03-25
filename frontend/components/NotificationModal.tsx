import React from 'react';
import { StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { Text, View } from './Themed';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/theme';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationModalProps {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
}

const NotificationModal = ({ isOpen, type, title, message, onClose }: NotificationModalProps) => {
  const { colorScheme } = useTheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={48} color={Colors.success} />;
      case 'error':
        return <AlertCircle size={48} color={Colors.error} />;
      case 'info':
        return <Info size={48} color={Colors.info} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'info':
        return 'rgba(47, 149, 220, 0.1)';
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={onClose}
          >
            <X size={20} color={themeColors.textLight} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: getIconBg() }]}>
            {getIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.message, { color: themeColors.textLight }]}>{message}</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationModal;
