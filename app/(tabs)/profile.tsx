import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileMenu } from '@/components/profile/ProfileMenu';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { ProfileStatsRow, ProfileStat } from '@/components/profile/ProfileStats';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/services/customerService';
import { Customer } from '@/types/customer.types';
import { getSavedVendors } from '@/services/savedVendorService';
import { listCustomerReviews } from '@/services/reviewService';
import { listCustomerLeads } from '@/services/leadService';
import { listGuests, getOrCreateGuestList } from '@/services/guestService';
import { subscribeQuoteRefresh } from '@/utils/quoteRefreshBus';

export default function ProfileScreen() {
  const { accessToken, user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ saved: 0, reviews: 0, quotes: 0, guests: 0 });

  const loadCustomerData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await getMe(accessToken);
      if (response.success && response.customer) {
        setCustomer(response.customer);
        return response.customer;
      }
    } catch (error) {
      console.error('[PROFILE] Failed to load customer:', error);
    }
    return null;
  }, [accessToken]);

  const loadStats = useCallback(async (cust: Customer | null) => {
    if (!accessToken || !cust) return;
    const next = { saved: 0, reviews: 0, quotes: 0, guests: 0 };

    try {
      const saved = await getSavedVendors(cust.id);
      next.saved = saved?.length || 0;
    } catch (e) { /* ignore */ }

    try {
      const rev = await listCustomerReviews(accessToken);
      if (rev?.success) next.reviews = rev.reviews?.length || 0;
    } catch (e) { /* ignore */ }

    try {
      const quotes = await listCustomerLeads({ lead_type: 'quote_request', limit: 100 }, accessToken);
      if (quotes?.success) next.quotes = quotes.leads?.length || 0;
    } catch (e) { /* ignore */ }

    try {
      const gl = await getOrCreateGuestList({ event_name: 'My Event' }, accessToken);
      if (gl.success) {
        const g = await listGuests({ list_id: gl.guest_list.id }, accessToken);
        if (g.success) next.guests = g.guests.length;
      }
    } catch (e) { /* ignore */ }

    setStats(next);
  }, [accessToken]);

  const customerRef = useRef<Customer | null>(null);
  customerRef.current = customer;

  const reloadAll = useCallback(async () => {
    const cust = await loadCustomerData();
    await loadStats(cust);
  }, [loadCustomerData, loadStats]);

  useFocusEffect(
    useCallback(() => {
      reloadAll();
    }, [reloadAll])
  );

  useEffect(() => {
    return subscribeQuoteRefresh((event) => {
      if (event.delta) {
        setStats((prev) => ({ ...prev, quotes: prev.quotes + event.delta! }));
      }
      void loadStats(customerRef.current);
    });
  }, [loadStats]);

  const handleEdit = () => setIsEditModalVisible(true);

  const handleSave = async (updatedData: Partial<Customer>) => {
    try {
      const { updateMe } = await import('@/services/customerService');
      if (!accessToken) return;
      const req: any = {};
      if (updatedData.name !== undefined) req.name = updatedData.name;
      if (updatedData.email !== undefined && updatedData.email !== null) req.email = updatedData.email;
      if (updatedData.address !== undefined && updatedData.address !== null) req.address = updatedData.address;
      if (updatedData.city !== undefined && updatedData.city !== null) req.city = updatedData.city;
      if (updatedData.state !== undefined && updatedData.state !== null) req.state = updatedData.state;
      if (updatedData.pincode !== undefined && updatedData.pincode !== null) req.pincode = updatedData.pincode;
      if (updatedData.area !== undefined && updatedData.area !== null) req.area = updatedData.area;
      if (updatedData.registration_source !== undefined && updatedData.registration_source !== null) {
        req.registration_source = updatedData.registration_source;
      }
      await updateMe(req, accessToken);
      await reloadAll();
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const statTiles: ProfileStat[] = [
    {
      icon: 'heart',
      value: stats.saved,
      label: 'Saved',
      tint: '#EF4444',
      iconBg: '#FEE2E2',
      href: '/saved-vendors',
    },
    {
      icon: 'star',
      value: stats.reviews,
      label: 'Reviews',
      tint: '#D97706',
      iconBg: '#FEF3C7',
      href: '/my-reviews',
    },
    {
      icon: 'document-text',
      value: stats.quotes,
      label: 'Quotes',
      tint: '#2563EB',
      iconBg: '#DBEAFE',
      href: '/my-quotes',
    },
  ];

  return (
    <View style={styles.container}>
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await reloadAll();
              setRefreshing(false);
            }}
            tintColor="#7C3AED"
          />
        }
      >
        <ProfileHeader customer={customer} onEdit={handleEdit} />
        <ProfileStatsRow stats={statTiles} />
        <ProfileDetails customer={customer} onEdit={handleEdit} />
        <ProfileMenu />
      </ScrollView>

      <ProfileEditModal
        visible={isEditModalVisible}
        customer={customer}
        authUser={user}
        onSave={handleSave}
        onClose={() => setIsEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  scrollContent: {
    paddingBottom: 30,
  },
});
