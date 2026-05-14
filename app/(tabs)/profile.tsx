import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
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
import { listGuests, getOrCreateGuestList } from '@/services/guestService';

export default function ProfileScreen() {
  const { accessToken, user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ saved: 0, reviews: 0, guests: 0 });

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
    const next = { saved: 0, reviews: 0, guests: 0 };

    try {
      const saved = await getSavedVendors(cust.id);
      next.saved = saved?.length || 0;
    } catch (e) { /* ignore */ }

    try {
      const rev = await listCustomerReviews(accessToken);
      if (rev?.success) next.reviews = rev.reviews?.length || 0;
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

  const reloadAll = useCallback(async () => {
    const cust = await loadCustomerData();
    await loadStats(cust);
  }, [loadCustomerData, loadStats]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

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
