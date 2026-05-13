import {
  AIBudgetPlannerCard,
  AIVendorMatchCard,
  QuickToolCard
} from '@/components/ai/SpecializedAITools';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { ChatFAB } from '@/components/home/ChatFAB';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { listGuests, getOrCreateGuestList } from '@/services/guestService';
import { listChecklists } from '@/services/checklistService';
import { listWeddingBudgetPlans } from '@/services/weddingBudgetService';
import { searchVendors } from '@/services/vendorSearchService';
import { useLocation } from '@/context/LocationContext';

export default function AIToolsScreen() {
  const { accessToken } = useAuth();
  const { city } = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    guests: 0,
    tasks: 0,
    vendors: 0,
    budget: 0,
    budgetLabel: 'Catering Allocation',
    budgetPercent: 35
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (!accessToken) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const newStats = { ...stats };

      // 1. Fetch Guests
      try {
        const glRes = await getOrCreateGuestList({ event_name: 'My Event' }, accessToken);
        if (glRes.success) {
          const gRes = await listGuests({ list_id: glRes.guest_list.id }, accessToken);
          if (gRes.success) {
            newStats.guests = gRes.guests.length;
          }
        }
      } catch (e) { console.error('Guest stats error:', e); }

      // 2. Fetch Tasks (Checklist)
      try {
        const cRes = await listChecklists(accessToken);
        if (cRes.success && cRes.checklists.length > 0) {
          // Count incomplete tasks
          const items = cRes.checklists[0].items || [];
          newStats.tasks = items.filter(i => !i.is_completed).length;
        }
      } catch (e) { console.error('Checklist stats error:', e); }

      // 3. Fetch Budget
      try {
        const bRes = await listWeddingBudgetPlans(accessToken);
        if (bRes.success && bRes.plans.length > 0) {
          const plan = bRes.plans[0];
          newStats.budget = plan.total_budget || 0;
          // You could calculate actual first category allocation here
          newStats.budgetPercent = 40; // Example dynamic update
          newStats.budgetLabel = 'Primary Allocation';
        }
      } catch (e) { console.error('Budget stats error:', e); }

      // 4. Fetch Vendors (in current city)
      try {
        const vRes = await searchVendors({
          mode: 'filter',
          filters: { city: city ? [city] : undefined },
          limit: 10
        });
        if (vRes.success) {
          newStats.vendors = vRes.count || vRes.results.length;
        }
      } catch (e) { console.error('Vendor stats error:', e); }

      setStats(newStats);
    } catch (err) {
      console.error('Failed to load AI tool stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, city]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <ExploreHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Plan with AI</Text>
          <Text style={styles.heroSubtitle}>
            Your personalized event intelligence.
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#003366" size="large" />
            <Text style={{ marginTop: 12, color: '#666' }}>Fetching latest updates...</Text>
          </View>
        ) : (
          <>
            {/* Quick Tools Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUICK TOOLS</Text>
              <View style={styles.quickToolsRow}>
                <QuickToolCard
                  icon="people-outline"
                  value={stats.guests.toString()}
                  label="Guest RSVP'd"
                  actionText="Manage"
                  href="/guest-list-manager"
                />
                <QuickToolCard
                  icon="checkmark-circle-outline"
                  value={stats.tasks.toString()}
                  label="Tasks Pending"
                  actionText="View List"
                  href="/checklist-generator"
                />
              </View>
            </View>

            {/* Main AI Tools */}
            <View style={styles.mainTools}>
              <AIVendorMatchCard vendorCount={stats.vendors} />
              <AIBudgetPlannerCard
                totalBudget={stats.budget}
                allocation={stats.budgetPercent}
                label={stats.budgetLabel}
              />
            </View>
          </>
        )}
      </ScrollView>

      <ChatFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  conciergeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  conciergeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conciergeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  quickToolsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  mainTools: {
    paddingHorizontal: 20,
  },
});
