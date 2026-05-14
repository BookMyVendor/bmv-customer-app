import { AIToolCard } from '@/components/ai/SpecializedAITools';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { ChatFAB } from '@/components/home/ChatFAB';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { listGuests, getOrCreateGuestList } from '@/services/guestService';
import { listChecklists } from '@/services/checklistService';
import { listWeddingBudgetPlans, getWeddingBudgetPlanCategories } from '@/services/weddingBudgetService';
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
    budgetPercent: 35,
    topVendors: [] as any[]
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (!accessToken) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const newStats = { ...stats };

      try {
        const glRes = await getOrCreateGuestList({ event_name: 'My Event' }, accessToken);
        if (glRes.success) {
          const gRes = await listGuests({ list_id: glRes.guest_list.id }, accessToken);
          if (gRes.success) {
            newStats.guests = gRes.guests.length;
          }
        }
      } catch (e) { console.error('Guest stats error:', e); }

      try {
        const cRes = await listChecklists(accessToken);
        if (cRes.success && cRes.checklists.length > 0) {
          const items = cRes.checklists[0].items || [];
          newStats.tasks = items.filter(i => !i.is_completed).length;
        }
      } catch (e) { console.error('Checklist stats error:', e); }

      try {
        const bRes = await listWeddingBudgetPlans(accessToken);
        if (bRes.success && bRes.plans.length > 0) {
          const plan = bRes.plans[0];
          const total = plan.total_budget || 0;
          newStats.budget = total;

          const catRes = await getWeddingBudgetPlanCategories({ plan_id: plan.id }, accessToken);
          if (catRes.success) {
            const allocated = catRes.categories.reduce((sum, cat) => sum + (parseFloat(cat.amount?.toString() || '0')), 0);
            if (total > 0) {
              newStats.budgetPercent = Math.round((allocated / total) * 100);
              newStats.budgetLabel = 'Budget Allocated';
            } else {
              newStats.budgetPercent = 0;
              newStats.budgetLabel = 'Set your budget';
            }
          }
        }
      } catch (e) { console.error('Budget stats error:', e); }

      try {
        const popularCategories = ['Caterers', 'Decorators', 'Photographers', 'Venues'];
        let foundSameService = false;

        for (const cat of popularCategories) {
          const vRes = await searchVendors({
            mode: 'filter',
            filters: {
              city: city ? [city] : undefined,
              serviceType: [cat]
            },
            limit: 5
          });

          if (vRes && vRes.results && vRes.results.length >= 2) {
            newStats.vendors = vRes.count;
            newStats.topVendors = vRes.results.slice(0, 2);
            foundSameService = true;
            break;
          }
        }

        if (!foundSameService) {
          for (const cat of popularCategories) {
            const vRes = await searchVendors({
              mode: 'filter',
              filters: { serviceType: [cat] },
              limit: 5
            });
            if (vRes && vRes.results && vRes.results.length >= 2) {
              newStats.topVendors = vRes.results.slice(0, 2);
              newStats.vendors = vRes.count;
              foundSameService = true;
              break;
            }
          }
        }

        if (!foundSameService) {
          const vRes = await searchVendors({ mode: 'filter', filters: {}, limit: 10 });
          if (vRes && vRes.results) {
            newStats.topVendors = vRes.results.slice(0, 2);
            newStats.vendors = vRes.count;
          }
        }
      } catch (e) { console.error('[AI TOOLS] Vendor fetch failed:', e); }

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>AI TOOLS</Text>
            <Ionicons name="sparkles" size={18} color="#6366F1" style={{ marginLeft: 6 }} />
          </View>
          <Text style={styles.headerSubtitle}>Smart tools to simplify your event planning</Text>
        </View>

        {loading && !refreshing ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#003366" size="large" />
            <Text style={{ marginTop: 12, color: '#666' }}>Fetching latest updates...</Text>
          </View>
        ) : (
          <View style={styles.cardsWrap}>
            <AIToolCard
              variant="vendor"
              badge="95% Match"
              title="AI Vendor Match"
              description={`Get ${stats.vendors > 0 ? Math.min(stats.vendors, 4) : 4} top vendor picks\nperfectly matched to your style.`}
              buttonText="Start Side-by-Side Analysis"
              image="https://images.unsplash.com/photo-1769638913840-2ca96d90e8a9?auto=format&fit=crop&q=80&w=600"
              href="/ai-vendor-match"
            />

            <AIToolCard
              variant="guests"
              icon="people"
              title="Guest List Manager"
              description={`Manage RSVPs, track guests\nand stay organized effortlessly.`}
              buttonText="Manage Guest List"
              image="https://images.unsplash.com/photo-1691480174869-436af8fd6eba?auto=format&fit=crop&q=80&w=600"
              href="/guest-list-manager"
            />

            <AIToolCard
              variant="checklist"
              icon="clipboard"
              title="Checklist Generator"
              description={`Get a personalized checklist\nso nothing is missed.`}
              buttonText="Generate Checklist"
              image="https://images.unsplash.com/photo-1768055104910-8c8d213835fb?auto=format&fit=crop&q=80&w=600"
              href="/checklist-generator"
            />

            <AIToolCard
              variant="budget"
              icon="wallet"
              title="Budget Planner"
              description={`Plan smart, track expenses\nand stay within budget.`}
              buttonText="Open Budget Planner"
              image="https://images.unsplash.com/photo-1762319021727-c73a939c4f3b?auto=format&fit=crop&q=80&w=600"
              href="/ai-budget-planner"
            />
          </View>
        )}
      </ScrollView>

      <ChatFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  cardsWrap: {
    paddingHorizontal: 16,
    gap: 16,
  },
});
