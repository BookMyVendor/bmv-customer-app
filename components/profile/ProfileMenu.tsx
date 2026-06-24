import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  isLast?: boolean;
  destructive?: boolean;
  badge?: string;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  subtitle,
  iconBg,
  iconColor,
  isLast,
  destructive,
  badge,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.row, !isLast && styles.rowDivider]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.rowText}>
      <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {!!badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <Ionicons
      name="chevron-forward"
      size={16}
      color={destructive ? '#FCA5A5' : '#CBD5E1'}
    />
  </TouchableOpacity>
);

export const ProfileMenu = () => {
  const router = useRouter();
  const { signOut, accessToken } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log out?',
      'You will need to sign in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            // Context signOut clears storage + sets isAuthenticated false even if API fails (e.g. expired token).
            await signOut(accessToken ?? undefined);
            router.dismissAll();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const notImplemented = (feature: string) =>
    Alert.alert(feature, 'Coming soon!', [{ text: 'OK' }]);

  return (
    <View style={styles.wrap}>
      {/* Activity */}
      <Text style={styles.heading}>My Activity</Text>
      <View style={styles.card}>
        <MenuItem
          icon="heart"
          label="Saved Vendors"
          subtitle="Vendors you bookmarked"
          iconBg="#FEE2E2"
          iconColor="#EF4444"
          onPress={() => router.push('/saved-vendors')}
        />
        <MenuItem
          icon="star"
          label="My Reviews"
          subtitle="Reviews you've shared"
          iconBg="#FEF3C7"
          iconColor="#D97706"
          onPress={() => router.push('/my-reviews')}
        />
        <MenuItem
          icon="document-text"
          label="My Quotes"
          subtitle="Quote requests you've sent"
          iconBg="#DBEAFE"
          iconColor="#2563EB"
          isLast
          onPress={() => router.push('/my-quotes')}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Made with love · BookMyVendors</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  heading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F1F2F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  destructive: {
    color: '#DC2626',
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
