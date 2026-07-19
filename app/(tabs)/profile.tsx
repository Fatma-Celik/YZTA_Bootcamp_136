import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { ActivityIndicator } from 'react-native';

// ─── Tip Tanımları ───
interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  route: string;
  badge?: string;
  badgeColor?: string;
}

// ─── Menü Verisi ───
const menuSections: MenuSection[] = [
  {
    title: 'Kişisel Sağlık',
    items: [
      {
        id: 'allergens',
        label: 'Alerjenlerim',
        description: 'Besin alerjenlerini yönet',
        icon: 'warning-outline',
        iconBg: 'rgba(245, 158, 11, 0.15)',
        iconColor: '#F59E0B',
        route: '/profile/allergens',
      },
      {
        id: 'health',
        label: 'Sağlığım',
        description: 'BMI, kilo takibi ve vücut verileri',
        icon: 'fitness-outline',
        iconBg: 'rgba(16, 185, 129, 0.15)',
        iconColor: '#10B981',
        route: '/profile/health',
      },
    ],
  },
  {
    title: 'Uygulama',
    items: [
      {
        id: 'preferences',
        label: 'Tercihler',
        description: 'Tema, dil ve bildirim ayarları',
        icon: 'settings-outline',
        iconBg: 'rgba(99, 102, 241, 0.15)',
        iconColor: '#818CF8',
        route: '/profile/preferences',
      },
    ],
  },
  {
    title: 'Hesap',
    items: [
      {
        id: 'account',
        label: 'Hesap',
        description: 'Bilgileri düzenle ve oturum yönetimi',
        icon: 'person-circle-outline',
        iconBg: 'rgba(255, 107, 53, 0.15)',
        iconColor: '#FF6B35',
        route: '/profile/account',
      },
    ],
  },
];

// ─── Stat Kutucuğu ───
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(71, 85, 105, 0.3)',
      }}
    >
      <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Menü Kalemi ───
function MenuRow({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
      }}
    >
      {/* İkon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: item.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={item.icon} size={22} color={item.iconColor} />
      </View>

      {/* Metin */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>{item.label}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 1 }}>
          {item.description}
        </Text>
      </View>

      {/* Badge (opsiyonel) */}
      {item.badge && (
        <View
          style={{
            backgroundColor: item.badgeColor ?? '#FF6B35',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.badge}</Text>
        </View>
      )}

      {/* Ok */}
      <Ionicons name="chevron-forward" size={16} color="#475569" />
    </TouchableOpacity>
  );
}

export default function TabProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { stats, loading: statsLoading } = useProfileStats();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  const email = user?.email ?? '—';
  const initials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  if (profileLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ color: '#F1F5F9', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>Profil</Text>
          <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500', marginTop: 2 }}>Hesap ve uygulama ayarları</Text>
        </View>

        <View style={{
          marginHorizontal: 16, marginTop: 16, backgroundColor: '#1E293B', borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: 'rgba(71, 85, 105, 0.3)', alignItems: 'center',
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#FF6B35', shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
          }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>{initials}</Text>
          </View>

          <Text style={{ color: '#F1F5F9', fontSize: 20, fontWeight: '800', marginTop: 12, letterSpacing: -0.3 }}>
            {displayName}
          </Text>
          <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '500', marginTop: 4 }}>{email}</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' }}>
            <StatBox label="Tarif" value={statsLoading ? '—' : String(stats.recipeCount)} />
            <StatBox label="Alışveriş" value={statsLoading ? '—' : String(stats.shoppingListCount)} />
            <StatBox label="Alerjen" value={statsLoading ? '—' : String(stats.allergenCount)} />
          </View>
        </View>

        {menuSections.map((section, sIdx) => (
          <View key={section.title} style={{ marginTop: sIdx === 0 ? 24 : 14, marginHorizontal: 16 }}>
            <Text style={{
              color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1,
              textTransform: 'uppercase', marginBottom: 6, marginLeft: 4,
            }}>
              {section.title}
            </Text>
            <View style={{
              backgroundColor: '#1E293B', borderRadius: 18, borderWidth: 1,
              borderColor: 'rgba(71, 85, 105, 0.3)', overflow: 'hidden',
            }}>
              {section.items.map((item, iIdx) => (
                <View key={item.id}>
                  <MenuRow item={item} onPress={() => router.push(item.route as any)} />
                  {iIdx < section.items.length - 1 && (
                    <View style={{ height: 1, backgroundColor: 'rgba(71, 85, 105, 0.2)', marginLeft: 74 }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={{ color: '#334155', fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 32 }}>
          NexBite v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
