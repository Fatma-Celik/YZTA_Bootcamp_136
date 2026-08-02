import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  options: AlertOptions | null;
  onClose: () => void;
}

export default function CustomAlert({ visible, options, onClose }: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !options) return null;

  const type = options.type || 'info';

  const getAlertIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle-outline' as const, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'error':
        return { name: 'close-circle-outline' as const, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'warning':
      case 'confirm':
        return { name: 'warning-outline' as const, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'info':
      default:
        return { name: 'information-circle-outline' as const, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' };
    }
  };

  const iconInfo = getAlertIcon();
  const isConfirm = type === 'confirm' || type === 'warning';

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel();
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* İkon */}
          <View style={[styles.iconWrapper, { backgroundColor: iconInfo.bg }]}>
            <Ionicons name={iconInfo.name} size={36} color={iconInfo.color} />
          </View>

          {/* Başlık ve Mesaj */}
          <Text style={styles.title}>{options.title}</Text>
          <Text style={styles.message}>{options.message}</Text>

          {/* Butonlar */}
          <View style={styles.buttonContainer}>
            {isConfirm && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCancel}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelText}>{options.cancelText || 'İptal'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirm}
              style={[
                styles.button,
                styles.confirmButton,
                type === 'error' && { backgroundColor: '#EF4444' },
                (type === 'warning' || type === 'confirm') && { backgroundColor: '#F59E0B' },
              ]}
            >
              <Text style={styles.confirmText}>
                {options.confirmText || (isConfirm ? 'Evet' : 'Tamam')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
  },
  cancelText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
