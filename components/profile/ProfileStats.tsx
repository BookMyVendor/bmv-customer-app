import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATS = [
  { label: 'SAVED VENDORS', value: '12' },
  { label: 'BOOKINGS', value: '5' },
  { label: 'REVIEWS', value: '3' },
];

export const ProfileStats = () => {
  return (
    <View style={styles.container}>
      {STATS.map((stat, index) => (
        <View key={stat.label} style={[
          styles.statCard,
          index !== STATS.length - 1 && styles.borderRight
        ]}>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: '#003366',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
  },
});
