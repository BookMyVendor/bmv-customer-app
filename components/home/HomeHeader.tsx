import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '@/context/LocationContext';
import { CityPickerModal } from './CityPickerModal';

export const HomeHeader = () => {
  const insets = useSafeAreaInsets();
  const { city } = useLocation();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.appName}>BookMyVendors</Text>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="location-sharp" size={18} color="#003366" />
          <Text style={styles.locationText}>{city || 'Select City'}</Text>
          <Ionicons name="chevron-down" size={14} color="#666" />
        </TouchableOpacity>

      </View>

      <CityPickerModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#003366',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  iconButton: {
    padding: 4,
  },
});

