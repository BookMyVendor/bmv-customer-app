import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ExploreHeader = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/images/bmv_internal_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>BookMyVendors</Text>
      </View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  logo: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#003366',
  },
});
