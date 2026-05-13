import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/types/customer.types';

interface ProfileDetailsProps {
  customer: Customer | null;
  onEdit: () => void;
}

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({ customer, onEdit }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const details = [
    { id: 'phone', label: 'Phone Number', value: customer?.phone || 'Not provided', icon: 'call-outline' },
    { id: 'email', label: 'Email Address', value: customer?.email || 'Not provided', icon: 'mail-outline' },
    { id: 'city', label: 'City', value: customer?.city || 'Not provided', icon: 'location-outline' },
    { id: 'state', label: 'State', value: customer?.state || 'Not provided', icon: 'map-outline' },
    { id: 'address', label: 'Address', value: customer?.address || 'Not provided', icon: 'home-outline' },
    { id: 'pincode', label: 'Pincode', value: customer?.pincode || 'Not provided', icon: 'pin-outline' },
    { id: 'member_since', label: 'Member since', value: formatDate(customer?.created_at), icon: 'calendar-outline' },
    { id: 'source', label: 'Registration source', value: customer?.registration_source || 'Web', icon: 'globe-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
          <Ionicons name="pencil" size={14} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {details.map((item, index) => (
          <View key={item.id} style={[styles.detailRow, index !== details.length - 1 && styles.borderBottom]}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={20} color="#6B7280" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value} numberOfLines={2}>{item.value}</Text>
            </View>
            {item.id === 'phone' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});
