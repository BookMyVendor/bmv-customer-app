import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from '@/services/authService';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  iconBgColor: string;
  iconColor: string;
  isLast?: boolean;
  destructive?: boolean;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, subtitle, iconBgColor, iconColor, isLast, destructive, onPress }) => (
  <TouchableOpacity style={[styles.menuItem, !isLast && styles.borderBottom]} onPress={onPress}>
    <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.menuLabel, destructive && styles.destructiveText]}>{label}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
  </TouchableOpacity>
);

export const ProfileMenu = () => {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.dismissAll();
              router.replace('/login');
            } catch (error) {
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
      <Text style={styles.sectionTitle}>Account & Activity</Text>
      <View style={styles.card}>
        <MenuItem 
          icon="heart-outline" 
          label="Saved Vendors" 
          subtitle="View your saved vendors"
          iconBgColor="#EEF2FF"
          iconColor="#4F46E5"
          onPress={() => router.push('/saved-vendors')}
        />
        <MenuItem 
          icon="star-outline" 
          label="My Reviews" 
          subtitle="Reviews you've written"
          iconBgColor="#F3E8FF"
          iconColor="#7E22CE"
          onPress={() => router.push('/my-reviews')}
        />
        <MenuItem 
          icon="log-out-outline" 
          label="Log Out" 
          subtitle="Sign out from your account"
          iconBgColor="#FEE2E2"
          iconColor="#EF4444"
          destructive
          isLast 
          onPress={handleLogout} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  destructiveText: {
    color: '#EF4444',
  },
});
