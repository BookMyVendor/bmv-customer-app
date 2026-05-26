import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { listCustomerLeads } from '@/services/leadService';
import { CustomerLeadSummary } from '@/types/lead.types';
import { subscribeQuoteRefresh } from '@/utils/quoteRefreshBus';

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStatus(status: string | null) {
  if (!status) return 'Pending';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function statusColors(status: string | null) {
  const key = (status || 'new').toLowerCase();
  if (key === 'won' || key === 'closed' || key === 'completed') {
    return { bg: '#DCFCE7', text: '#15803D' };
  }
  if (key === 'lost' || key === 'cancelled' || key === 'rejected') {
    return { bg: '#FEE2E2', text: '#DC2626' };
  }
  if (key === 'quoted' || key === 'contacted' || key === 'in_progress') {
    return { bg: '#DBEAFE', text: '#2563EB' };
  }
  return { bg: '#FEF3C7', text: '#D97706' };
}

export default function MyQuotesScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [quotes, setQuotes] = useState<CustomerLeadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuotes = useCallback(async (options?: { silent?: boolean }) => {
    if (!accessToken) return;
    try {
      if (!options?.silent) setIsLoading(true);
      const response = await listCustomerLeads(
        { lead_type: 'quote_request', limit: 100 },
        accessToken
      );
      if (response.success && response.leads) {
        const sorted = [...response.leads].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setQuotes(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch my quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, [fetchQuotes])
  );

  useEffect(() => {
    return subscribeQuoteRefresh(() => {
      fetchQuotes({ silent: true });
    });
  }, [fetchQuotes]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuotes({ silent: true });
    setRefreshing(false);
  }, [fetchQuotes]);

  const renderQuoteItem = ({ item }: { item: CustomerLeadSummary }) => {
    const colors = statusColors(item.lead_status);
    return (
      <TouchableOpacity
        style={styles.quoteCard}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: '/my-quote/[id]', params: { id: item.id } })}
      >
        <View style={styles.quoteHeader}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.business_name || 'Vendor'}
            </Text>
            <Text style={styles.dateText}>Sent {formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {formatStatus(item.lead_status)}
            </Text>
          </View>
        </View>

        {item.event_type ? (
          <View style={styles.metaRow}>
            <Ionicons name="sparkles-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{item.event_type}</Text>
          </View>
        ) : null}

        {item.event_date ? (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>Event: {formatDate(item.event_date)}</Text>
          </View>
        ) : null}

        {item.guest_count ? (
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{item.guest_count} guests</Text>
          </View>
        ) : null}

        {item.requirements ? (
          <Text style={styles.requirementsText} numberOfLines={2}>
            {item.requirements}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View details</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Quotes</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : quotes.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Quotes Yet</Text>
            <Text style={styles.emptySubtitle}>
              Request a quote from any vendor and it will show up here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={quotes}
            keyExtractor={(item) => item.id}
            renderItem={renderQuoteItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#3B82F6"
              />
            }
          />
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
    marginRight: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
  },
  requirementsText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
