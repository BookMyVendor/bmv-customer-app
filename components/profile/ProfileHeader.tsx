import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/types/customer.types';

interface ProfileHeaderProps {
  customer: Customer | null;
  onEdit?: () => void;
}

const maskPhone = (p?: string) => {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  if (digits.length < 10) return p;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${'•'.repeat(4)} ${digits.slice(-2)}`;
};

const monthsSince = (dateStr?: string) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.max(1, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
};

const computeCompletion = (c: Customer | null): number => {
  if (!c) return 0;
  const fields = [c.name, c.email, c.phone, c.address, c.city, c.state, c.pincode];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ customer, onEdit }) => {
  const initial = customer?.name ? customer.name.charAt(0).toUpperCase() : 'U';
  const completion = computeCompletion(customer);
  const months = monthsSince(customer?.created_at);
  const cityLine = [customer?.city, customer?.state].filter(Boolean).join(', ');

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#1E1B4B', '#4338CA', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* decorative blobs */}
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />

        {/* top row: avatar + name */}
        <View style={styles.topRow}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>
          
          </View>

          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.name}>
                {customer?.name || 'Welcome'}
              </Text>
              <Ionicons name="checkmark-circle" size={18} color="#34D399" style={{ marginLeft: 6 }} />
            </View>
            <Text style={styles.phone} numberOfLines={1}>
              {customer?.phone ? maskPhone(customer.phone) : 'Add your phone'}
            </Text>
            {!!cityLine && (
              <View style={styles.locationChip}>
                <Ionicons name="location-sharp" size={12} color="#fff" />
                <Text style={styles.locationText} numberOfLines={1}>{cityLine}</Text>
              </View>
            )}
          </View>
        </View>

      
        {/* completion bar */}
        <View style={styles.completionWrap}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionLabel}>Profile completion</Text>
            <Text style={styles.completionValue}>{completion}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressClip, { width: `${Math.max(completion, 4)}%` }]}>
              <LinearGradient
                colors={['#FBBF24', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </View>
          </View>
        </View>

        {/* edit profile button */}
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blob1: { width: 200, height: 200, top: -80, right: -60 },
  blob2: { width: 130, height: 130, bottom: -50, left: -40, backgroundColor: 'rgba(244,114,182,0.18)' },
  blob3: { width: 80, height: 80, top: 40, right: 60, backgroundColor: 'rgba(251,191,36,0.10)' },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOuter: {
    width: 76,
    height: 76,
    position: 'relative',
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  identity: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  phone: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
    gap: 4,
    maxWidth: '95%',
  },
  locationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  metaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  completionWrap: {
    marginTop: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  completionLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  completionValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  progressBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressClip: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
    height: 8,
    minWidth: 300,
  },

  editBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingVertical: 12,
    borderRadius: 999,
  },
  editText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
