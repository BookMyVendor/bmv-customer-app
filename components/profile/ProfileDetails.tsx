import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '@/types/customer.types';

interface ProfileDetailsProps {
  customer: Customer | null;
  onEdit: () => void;
}

type Row = {
  id: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  verified?: boolean;
  missing?: boolean;
};

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({ customer, onEdit }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const contactRows: Row[] = [
    {
      id: 'phone',
      label: 'Phone',
      value: customer?.phone || 'Not provided',
      icon: 'call',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      verified: !!customer?.phone,
    },
    {
      id: 'email',
      label: 'Email',
      value: customer?.email || 'Add email',
      icon: 'mail',
      iconBg: '#FCE7F3',
      iconColor: '#DB2777',
      missing: !customer?.email,
    },
  ];

  const addressRows: Row[] = [
    {
      id: 'address',
      label: 'Street Address',
      value: customer?.address || 'Add address',
      icon: 'home',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      missing: !customer?.address,
    },
    {
      id: 'city',
      label: 'City / State',
      value: [customer?.city, customer?.state].filter(Boolean).join(', ') || 'Not set',
      icon: 'location',
      iconBg: '#D1FAE5',
      iconColor: '#059669',
      missing: !customer?.city && !customer?.state,
    },
    {
      id: 'pincode',
      label: 'Pincode',
      value: customer?.pincode || 'Not provided',
      icon: 'pin',
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
      missing: !customer?.pincode,
    },
  ];

  const accountRows: Row[] = [
    {
      id: 'member_since',
      label: 'Member since',
      value: formatDate(customer?.created_at),
      icon: 'calendar',
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
    },
    {
      id: 'source',
      label: 'Signed up via',
      value: (customer?.registration_source || 'Mobile').replace(/^./, c => c.toUpperCase()),
      icon: 'phone-portrait',
      iconBg: '#E0E7FF',
      iconColor: '#4F46E5',
    },
  ];

  const renderRow = (item: Row, isLast: boolean) => (
    <View key={item.id} style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={16} color={item.iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text
          style={[styles.rowValue, item.missing && styles.rowValueMissing]}
          numberOfLines={2}
        >
          {item.value}
        </Text>
      </View>
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={11} color="#059669" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}
      {item.missing && (
        <TouchableOpacity style={styles.addBtn} onPress={onEdit}>
          <Ionicons name="add" size={12} color="#4F46E5" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const Section = ({
    title,
    sub,
    rows,
    showEdit,
  }: {
    title: string;
    sub?: string;
    rows: Row[];
    showEdit?: boolean;
  }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {!!sub && <Text style={styles.sectionSub}>{sub}</Text>}
        </View>
      </View>
      <View style={styles.card}>
        {rows.map((r, i) => renderRow(r, i === rows.length - 1))}
      </View>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <Section
        title="Contact"
        sub="How we reach you"
        rows={contactRows}
        showEdit
      />
      <Section
        title="Address"
        sub="Where we deliver experiences"
        rows={addressRows}
      />
      <Section
        title="Account"
        rows={accountRows}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    marginTop: 22,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F2F4',
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
  iconBox: {
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
  rowLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  rowValueMissing: {
    color: '#94A3B8',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
