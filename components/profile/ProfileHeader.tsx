import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Customer } from '@/types/customer.types';
import { LinearGradient } from 'expo-linear-gradient';

interface ProfileHeaderProps {
  customer: Customer | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ customer }) => {
  const initial = customer?.name
    ? customer.name.charAt(0).toUpperCase()
    : 'U';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* subtle glow */}
        <View style={styles.glow} />

        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={styles.info}>
            <Text numberOfLines={1} style={styles.name}>
              {customer?.name || 'Loading...'}
            </Text>

            <Text numberOfLines={1} style={styles.email}>
              {customer?.email || 'No email provided'}
            </Text>

          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  card: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
    position: 'relative',

    shadowColor: '#1E3A8A',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -70,
    right: -40,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },

  email: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginTop: 2,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  metaChip: {
    gap: 2,
  },

  metaLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
  },

  metaValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 12,
  },
});