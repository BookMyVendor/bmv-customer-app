import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from '@/services/authService';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isLast?: boolean;
  destructive?: boolean;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, isLast, destructive, onPress }) => (
  <TouchableOpacity style={[styles.menuItem, !isLast && styles.borderBottom]} onPress={onPress}>
    <View style={[styles.iconWrapper, destructive && styles.destructiveIcon]}>
      <Ionicons name={icon} size={20} color={destructive ? '#FF4B4B' : '#003366'} />
    </View>
    <Text style={[styles.menuLabel, destructive && styles.destructiveText]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color="#CCC" />
  </TouchableOpacity>
);

export const ProfileMenu = () => {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[PROFILE MENU] Attempting to log out');
              await signOut();
              console.log('[PROFILE MENU] Logged out successfully, navigating to login');
              router.dismissAll();
              router.replace('/login');
            } catch (error) {
              console.error('[PROFILE MENU] Logout failed, navigating to login anyway');
              const errorMessage = error instanceof Error ? error.message : 'Failed to log out';
              console.error('[PROFILE MENU] Error:', errorMessage);
              router.dismissAll();
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ACCOUNT ACTIVITY</Text>
      <View style={styles.group}>
        <MenuItem icon="calendar-outline" label="My Bookings" />
        <MenuItem icon="heart-outline" label="Saved Vendors" />
        <MenuItem icon="card-outline" label="Payment Methods" isLast />
      </View>

      <Text style={styles.sectionTitle}>PREFERENCES & SUPPORT</Text>
      <View style={styles.group}>
        <MenuItem icon="settings-outline" label="Settings" />
        <MenuItem icon="help-circle-outline" label="Support & FAQ" />
        <MenuItem icon="log-out-outline" label="Log Out" destructive isLast onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  group: {
    backgroundColor: '#F8F9FB',
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#FFF',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  destructiveIcon: {
    backgroundColor: '#FFF0F0',
  },
  destructiveText: {
    color: '#FF4B4B',
  },
});
