import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileMenu } from '@/components/profile/ProfileMenu';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/services/customerService';
import { Customer } from '@/types/customer.types';

export default function ProfileScreen() {
  const { accessToken, user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      loadCustomerData();
    }
  }, [accessToken]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      if (!accessToken) return;
      console.log('[PROFILE] Fetching customer data...');
      const response = await getMe(accessToken as string);
      console.log('[PROFILE] getMe response:', JSON.stringify(response));
      if (response.success && response.customer) {
        setCustomer(response.customer);
      } else {
        console.warn('[PROFILE] getMe returned no customer data');
      }
    } catch (error) {
      console.error('[PROFILE] Failed to load customer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handleSave = async (updatedData: Partial<Customer>) => {
    try {
      const { updateMe } = await import('@/services/customerService');
      if (!accessToken) return;
      const updateRequest: any = {};
      if (updatedData.name !== undefined) updateRequest.name = updatedData.name;
      if (updatedData.email !== undefined && updatedData.email !== null) updateRequest.email = updatedData.email;
      if (updatedData.address !== undefined && updatedData.address !== null) updateRequest.address = updatedData.address;
      if (updatedData.city !== undefined && updatedData.city !== null) updateRequest.city = updatedData.city;
      if (updatedData.state !== undefined && updatedData.state !== null) updateRequest.state = updatedData.state;
      if (updatedData.pincode !== undefined && updatedData.pincode !== null) updateRequest.pincode = updatedData.pincode;
      if (updatedData.area !== undefined && updatedData.area !== null) updateRequest.area = updatedData.area;
      if (updatedData.registration_source !== undefined && updatedData.registration_source !== null) updateRequest.registration_source = updatedData.registration_source;
      await updateMe(updateRequest, accessToken);
      await loadCustomerData();
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  return (
    <View style={styles.container}>
      <HomeHeader />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ProfileHeader customer={customer} onEdit={handleEdit} />
        <ProfileStats />
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

