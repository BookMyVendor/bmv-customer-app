import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExploreFilterRowProps {
  priceLabel: string | null;
  ratingLabel: string | null;
  sortLabel: string | null;
  onPricePress: () => void;
  onRatingPress: () => void;
  onSortPress: () => void;
}

export const ExploreFilterRow = ({ 
  priceLabel, 
  ratingLabel, 
  sortLabel,
  onPricePress, 
  onRatingPress,
  onSortPress 
}: ExploreFilterRowProps) => {
  const isPriceActive = !!priceLabel;
  const isRatingActive = !!ratingLabel;
  const isSortActive = !!sortLabel && sortLabel !== 'Top Rated';

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.chip, isSortActive && styles.chipActive]}
          onPress={onSortPress}
        >
          <Ionicons name="swap-vertical" size={16} color={isSortActive ? '#fff' : '#003366'} />
          <Text style={[styles.chipText, isSortActive && styles.chipTextActive]}>
            {sortLabel || 'Sort'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, isPriceActive && styles.chipActive]}
          onPress={onPricePress}
        >
          <Text style={[styles.chipText, isPriceActive && styles.chipTextActive]}>
            {priceLabel || 'Price Range'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={isPriceActive ? '#fff' : '#666'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, isRatingActive && styles.chipActive]}
          onPress={onRatingPress}
        >
          <Text style={[styles.chipText, isRatingActive && styles.chipTextActive]}>
            {ratingLabel || 'Ratings'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={isRatingActive ? '#fff' : '#666'} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  chipText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
