import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorResult } from './vendorSearchService';

const SAVED_VENDORS_PREFIX = '@saved_vendors_';

export const getSavedVendors = async (userId: string): Promise<VendorResult[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${SAVED_VENDORS_PREFIX}${userId}`);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error fetching saved vendors:', e);
    return [];
  }
};

export const saveVendor = async (userId: string, vendor: VendorResult): Promise<void> => {
  try {
    const savedVendors = await getSavedVendors(userId);
    const exists = savedVendors.find(v => v.business_id === vendor.business_id);
    
    if (!exists) {
      const updatedVendors = [...savedVendors, vendor];
      await AsyncStorage.setItem(
        `${SAVED_VENDORS_PREFIX}${userId}`,
        JSON.stringify(updatedVendors)
      );
    }
  } catch (e) {
    console.error('Error saving vendor:', e);
  }
};

export const unsaveVendor = async (userId: string, businessId: string): Promise<void> => {
  try {
    const savedVendors = await getSavedVendors(userId);
    const updatedVendors = savedVendors.filter(v => v.business_id !== businessId);
    await AsyncStorage.setItem(
      `${SAVED_VENDORS_PREFIX}${userId}`,
      JSON.stringify(updatedVendors)
    );
  } catch (e) {
    console.error('Error unsaving vendor:', e);
  }
};

export const isVendorSaved = async (userId: string, businessId: string): Promise<boolean> => {
  try {
    const savedVendors = await getSavedVendors(userId);
    return savedVendors.some(v => v.business_id === businessId);
  } catch (e) {
    return false;
  }
};
