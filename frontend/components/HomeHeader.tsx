import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeHeader() {
  const [greeting, setGreeting] = useState('Merhaba');
  const { unreadCount, togglePanel } = useNotifications();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { colors } = useTheme();

  const rawName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Kullanıcı');
  const firstName = rawName ? rawName.split(' ')[0] : 'Kullanıcı';

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setGreeting('Günaydın');
    else if (hour >= 12 && hour < 18) setGreeting('Merhaba');
    else if (hour >= 18 && hour < 24) setGreeting('İyi Akşamlar');
    else setGreeting('İyi Geceler');
  }, []);

  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 48,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
      }}
    >
      {/* Üst Satır: Logo ve Bildirim Çanı */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
          <Image style={{ width: 40, height: 40 }} resizeMode="contain" source={require('../assets/images/logo.png')} />
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>
            {greeting}, <Text style={{ color: colors.primary }}>{firstName}!</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={{
            marginLeft: 'auto',
            padding: 8,
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
          onPress={togglePanel}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 18,
                height: 18,
                backgroundColor: colors.primary,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}