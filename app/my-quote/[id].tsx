import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { getCustomerLead } from '@/services/leadService';
import { CustomerLeadDetail, LeadCommunication } from '@/types/lead.types';

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatStatus(status: string | null) {
  if (!status) return 'Pending';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color="#6B7280" />
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function MessageBubble({ item }: { item: LeadCommunication }) {
  const fromVendor = item.is_from_vendor;
  return (
    <View style={[styles.messageRow, fromVendor ? styles.messageRowVendor : styles.messageRowCustomer]}>
      <View style={[styles.messageBubble, fromVendor ? styles.vendorBubble : styles.customerBubble]}>
        <Text style={styles.messageSender}>{fromVendor ? 'Vendor' : 'You'}</Text>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.messageTime}>{formatDate(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function MyQuoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [lead, setLead] = useState<CustomerLeadDetail | null>(null);
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!accessToken || !id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCustomerLead({ lead_id: id }, accessToken);
      if (response.success) {
        setLead(response.lead);
        setCommunications(response.communications || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quote');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, id]);

  React.useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : error || !lead ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error || 'Quote not found'}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.businessName}>{lead.business_name || 'Vendor'}</Text>
              {lead.business_city ? (
                <Text style={styles.businessCity}>{lead.business_city}</Text>
              ) : null}

              <View style={styles.statusRow}>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipLabel}>Status</Text>
                  <Text style={styles.statusChipValue}>{formatStatus(lead.lead_status)}</Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipLabel}>Sent</Text>
                  <Text style={styles.statusChipValue}>{formatDate(lead.created_at)}</Text>
                </View>
              </View>

              {lead.business_id ? (
                <TouchableOpacity
                  style={styles.vendorLinkBtn}
                  onPress={() =>
                    router.push({ pathname: '/vendor/[id]', params: { id: lead.business_id! } })
                  }
                >
                  <Ionicons name="storefront-outline" size={16} color="#2563EB" />
                  <Text style={styles.vendorLinkText}>View vendor profile</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Your Request</Text>
              {lead.event_type ? (
                <DetailRow icon="sparkles-outline" label="Event" value={lead.event_type} />
              ) : null}
              {lead.event_date ? (
                <DetailRow icon="calendar-outline" label="Event date" value={formatDate(lead.event_date)} />
              ) : null}
              {lead.event_location ? (
                <DetailRow icon="location-outline" label="Location" value={lead.event_location} />
              ) : null}
              {lead.guest_count ? (
                <DetailRow icon="people-outline" label="Guests" value={String(lead.guest_count)} />
              ) : null}
              {lead.budget_range ? (
                <DetailRow icon="wallet-outline" label="Budget" value={lead.budget_range} />
              ) : null}
              {lead.requirements ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.detailLabel}>Requirements</Text>
                  <Text style={styles.requirementsValue}>{lead.requirements}</Text>
                </View>
              ) : null}
              {lead.notes ? (
                <View style={styles.requirementsBlock}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.requirementsValue}>{lead.notes}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Messages</Text>
              {communications.length === 0 ? (
                <Text style={styles.noMessagesText}>
                  No messages yet. The vendor may reply here once they review your request.
                </Text>
              ) : (
                communications.map((item) => <MessageBubble key={item.id} item={item} />)
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  businessCity: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statusChip: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 10,
  },
  statusChipLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusChipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  vendorLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  vendorLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  requirementsBlock: {
    marginBottom: 12,
  },
  requirementsValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 4,
  },
  noMessagesText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  messageRow: {
    marginBottom: 10,
  },
  messageRowVendor: {
    alignItems: 'flex-start',
  },
  messageRowCustomer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 14,
    padding: 12,
  },
  vendorBubble: {
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 4,
  },
  customerBubble: {
    backgroundColor: '#F3F4F6',
    borderTopRightRadius: 4,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
});
