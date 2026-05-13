import { ExploreFilterRow } from '@/components/explore/ExploreFilterRow';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { ExploreVendorCard } from '@/components/explore/ExploreVendorCard';
import { PriceFilterModal, PriceOption } from '@/components/explore/PriceFilterModal';
import { RatingFilterModal, RatingOption } from '@/components/explore/RatingFilterModal';
import { ChatFAB } from '@/components/home/ChatFAB';
import { useLocation } from '@/context/LocationContext';
import { getBusinessPricing, getLowestPrice } from '@/services/pricingService';
import { searchVendors, VendorResult } from '@/services/vendorSearchService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SortFilterModal, SortOption } from '@/components/explore/SortFilterModal';

const PRICE_LABELS: Record<PriceOption['value'], string> = {
  any: 'Any price',
  under50k: 'Under ₹50K',
  '50k-2l': '₹50K - ₹2L',
  above2l: 'Above ₹2L',
};

const RATING_LABELS: Record<RatingOption['value'], string> = {
  any: 'Any rating',
  '4.0': '4.0+',
  '4.5': '4.5+',
  '4.8': '4.8+',
};

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Relevance',
  rating: 'Top Rated',
  distance: 'Nearest',
  price: 'Budget-friendly',
};

export default function ExploreScreen() {
  const { city: locationCity } = useLocation();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    query?: string; 
    city?: string; 
    fromDashboard?: string;
    categoryName?: string;
    categoryType?: string;
    businessModel?: string;
  }>();
  const { query: searchQuery, city: searchCity, fromDashboard, categoryName, categoryType, businessModel } = params;

  const [vendors, setVendors] = useState<VendorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [message, setMessage] = useState<string | undefined>();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [priceFilter, setPriceFilter] = useState<PriceOption['value'] | null>(null);
  const [ratingFilter, setRatingFilter] = useState<RatingOption['value'] | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const isFromDashboard = fromDashboard === 'true';
  const shouldApplyCityFilter = isFromDashboard || !!searchCity;
  const effectiveCity = searchCity || (isFromDashboard ? locationCity : null);

  const buildApiFilters = () => {
    const filters: Record<string, any> = {};
    if (effectiveCity) filters.city = effectiveCity;
    
    if (categoryName) {
      if (categoryType === 'event') {
        filters.eventType = [categoryName];
      } else {
        filters.serviceType = [categoryName];
      }
    }

    if (priceFilter && priceFilter !== 'any') {
      if (priceFilter === 'under50k') filters.maxBudget = 50000;
      if (priceFilter === '50k-2l') filters.maxBudget = 200000;
    }
    if (ratingFilter && ratingFilter !== 'any') {
      filters.minRating = parseFloat(ratingFilter);
    }
    return filters;
  };

  const fetchVendors = async (pageNum = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setVendors([]);
      }
      setMessage(undefined);

      const apiFilters = buildApiFilters();

      const searchParams: any = {
        mode: sortBy === 'relevance' && searchQuery ? 'smart' : 'filter',
        filters: apiFilters,
        page: pageNum,
        limit: 10,
      };

      if (sortBy !== 'relevance') {
        searchParams.sortBy = sortBy;
        searchParams.sortOrder = sortBy === 'price' ? 'asc' : 'desc';
      }

      if (searchParams.mode === 'smart') {
        searchParams.smartQuery = searchQuery;
      } else if (searchQuery && searchQuery !== categoryName) {
        searchParams.filters.vendorName = searchQuery;
      }

      const response = await searchVendors(searchParams);
      
      if (isLoadMore) {
        setVendors(prev => [...prev, ...response.results]);
      } else {
        setVendors(response.results);
      }
      
      setTotalCount(response.count);
      setHasMore(response.results.length === 10);
      setMessage(response.message);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchVendors(1, false);
  }, [searchQuery, searchCity, fromDashboard, locationCity, priceFilter, ratingFilter, sortBy]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVendors(nextPage, true);
    }
  };

  const filteredVendors = useMemo(() => {
    return vendors;
  }, [vendors]);

  const handleSearchSubmit = () => {
    const trimmed = localSearchQuery.trim();
    const newParams: Record<string, string> = {};
    if (trimmed) newParams.query = trimmed;
    if (effectiveCity) newParams.city = effectiveCity;
    router.replace({ pathname: '/(tabs)/explore', params: newParams });
  };

  const clearCityFilter = () => {
    const newParams: Record<string, string> = {};
    if (searchQuery) newParams.query = searchQuery;
    router.replace({ pathname: '/(tabs)/explore', params: newParams });
  };

  const clearSearchFilter = () => {
    setLocalSearchQuery('');
    const newParams: Record<string, string> = {};
    if (effectiveCity && isFromDashboard) {
      newParams.fromDashboard = 'true';
      newParams.city = effectiveCity;
    } else if (searchCity) {
      newParams.city = searchCity;
    }
    router.replace({ pathname: '/(tabs)/explore', params: newParams });
  };
  
  const clearCategoryFilter = () => {
    const newParams = { ...params };
    delete newParams.categoryName;
    delete newParams.categoryType;
    delete newParams.businessModel;
    if (searchQuery === categoryName) {
      delete newParams.query;
    }
    router.replace({ pathname: '/(tabs)/explore', params: newParams });
  };

  const clearAllFilters = () => {
    setPriceFilter(null);
    setRatingFilter(null);
    setLocalSearchQuery('');
    router.replace({ pathname: '/(tabs)/explore' });
  };

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; onClear: () => void }[] = [];
    if (effectiveCity && shouldApplyCityFilter) {
      chips.push({ label: effectiveCity, onClear: clearCityFilter });
    }
    if (searchQuery && searchQuery !== categoryName) {
      chips.push({ label: `"${searchQuery}"`, onClear: clearSearchFilter });
    }
    if (categoryName) {
      const typeLabel = businessModel ? `${businessModel.charAt(0).toUpperCase() + businessModel.slice(1)}: ` : 
                        categoryType ? `${categoryType.charAt(0).toUpperCase() + categoryType.slice(1)}: ` : '';
      chips.push({ label: `${typeLabel}${categoryName}`, onClear: clearCategoryFilter });
    }
    if (priceFilter && priceFilter !== 'any') {
      chips.push({ label: PRICE_LABELS[priceFilter], onClear: () => setPriceFilter(null) });
    }
    if (ratingFilter && ratingFilter !== 'any') {
      chips.push({ label: RATING_LABELS[ratingFilter], onClear: () => setRatingFilter(null) });
    }
    return chips;
  }, [effectiveCity, shouldApplyCityFilter, searchQuery, priceFilter, ratingFilter]);

  return (
    <View style={styles.container}>
      <ExploreHeader />

      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.business_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Grand Ballroom Venues"
                  placeholderTextColor="#999"
                  value={localSearchQuery}
                  onChangeText={setLocalSearchQuery}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                />
                {localSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setLocalSearchQuery(''); if (searchQuery) clearSearchFilter(); }}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ExploreFilterRow
              priceLabel={priceFilter ? PRICE_LABELS[priceFilter] : null}
              ratingLabel={ratingFilter ? RATING_LABELS[ratingFilter] : null}
              sortLabel={SORT_LABELS[sortBy]}
              onPricePress={() => setShowPriceModal(true)}
              onRatingPress={() => setShowRatingModal(true)}
              onSortPress={() => setShowSortModal(true)}
            />

            {activeFilterChips.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersContainer}>
                {activeFilterChips.map((chip, index) => (
                  <View key={index} style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>{chip.label}</Text>
                    <TouchableOpacity onPress={chip.onClear} style={styles.clearIcon}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {totalCount} RESULTS{effectiveCity && shouldApplyCityFilter ? ` IN ${effectiveCity.toUpperCase()}` : ''}
              </Text>
            </View>

            {message && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003366" />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.vendorList}>
            <ExploreVendorCard
              vendor={item}
            />
          </View>
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#003366" />
            </View>
          ) : null
        }
      />

      <ChatFAB />

      <PriceFilterModal
        visible={showPriceModal}
        selected={priceFilter}
        onClose={() => setShowPriceModal(false)}
        onSelect={(value) => setPriceFilter(value === 'any' ? null : value)}
      />

      <RatingFilterModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        selectedOption={ratingFilter || 'any'}
        onSelect={(val) => setRatingFilter(val === 'any' ? null : val)}
      />

      <SortFilterModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        selectedOption={sortBy}
        onSelect={setSortBy}
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
    paddingBottom: 100,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearIcon: {
    padding: 2,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003366',
    marginLeft: 4,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortValue: {
    fontSize: 13,
    color: '#003366',
    fontWeight: '700',
  },
  vendorList: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  messageContainer: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  messageText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
