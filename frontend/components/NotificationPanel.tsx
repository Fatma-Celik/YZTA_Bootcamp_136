import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.45;

// ─── Zaman Formatlayıcı ───
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Az önce';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

// ─── İkon Seçici ───
function getNotifIcon(type: AppNotification['type']): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
} {
  switch (type) {
    case 'success':
      return { name: 'checkmark-circle', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    case 'error':
      return { name: 'close-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    case 'info':
    default:
      return { name: 'information-circle', color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.15)' };
  }
}

// ─── Bildirim Satırı ───
function NotificationItem({ notif }: { notif: AppNotification }) {
  const { colors } = useTheme();
  const { name, color, bg } = getNotifIcon(notif.type);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.cardHighlight,
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        gap: 10,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={name} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 18 }} numberOfLines={2}>
          {notif.message}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500', marginTop: 4 }}>
          {timeAgo(notif.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// ─── Panel Bileşeni ───
export default function NotificationPanel() {
  const { notifications, panelVisible, closePanel, clearAll, markAllRead } = useNotifications();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(PANEL_HEIGHT + 50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (panelVisible) {
      setIsRendered(true);
      markAllRead();
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: PANEL_HEIGHT + 50,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [panelVisible]);

  if (!isRendered) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, zIndex: 998 }, { opacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closePanel} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            zIndex: 999,
            borderTopWidth: 1,
            borderColor: colors.cardBorder,
            shadowColor: colors.cardBorder,
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 20,
            height: PANEL_HEIGHT,
            paddingBottom: insets.bottom + 8,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Panel Handle */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.iconDefault }} />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="notifications" size={18} color={colors.primary} />
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>Bildirimler</Text>
            {notifications.length > 0 && (
              <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{notifications.length}</Text>
              </View>
            )}
          </View>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bildirim Listesi */}
        {notifications.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 }}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.iconDefault} />
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 12 }}>Henüz bildirim yok</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 4, textAlign: 'center' }}>Yeni bir güncelleme veya duyuru olduğunda seni buradan bilgilendireceğiz.</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((notif) => (
              <NotificationItem key={notif.id} notif={notif} />
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </>
  );
}
