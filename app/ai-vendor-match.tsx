import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchVendors, VendorResult } from '@/services/vendorSearchService';
import { getCategoryTree } from '@/services/categoryService';
import { CategoryTreeNode } from '@/types/category.types';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import BulkQuoteModal from '@/components/vendor/BulkQuoteModal';
import { getBusinessPricing, getLowestPrice } from '@/services/pricingService';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

function getMediaUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? url.slice(1) : url}`;
}

const getInitials = (name: string) => {
  if (!name) return 'V';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const VendorCard = ({ vendor, onRemove, isAdd, onPress }: any) => {
  if (isAdd) {
    return (
      <TouchableOpacity style={styles.vendorCard} onPress={onPress}>
        <View style={styles.addVendorContent}>
          <View style={styles.addVendorIcon}>
            <Ionicons name="add" size={24} color="#999" />
          </View>
          <Text style={styles.addVendorText}>Add Vendor</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const imageUrl = getMediaUrl(vendor.cover_photo_url || vendor.profile_image);
  const initials = getInitials(vendor.business_name);

  return (
    <View style={styles.vendorCard}>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Ionicons name="close-circle" size={20} color="#FF4D4D" />
      </TouchableOpacity>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.vendorImage} />
      ) : (
        <View style={[styles.vendorImage, styles.initialsContainer]}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}
      <Text style={styles.vendorName} numberOfLines={1}>{vendor.business_name}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={12} color="#FFD700" />
        <Text style={styles.ratingText}>{vendor.calculated_rating || '0.0'}</Text>
      </View>
    </View>
  );
};

const ComparisonSection = ({ title, iconName, data, expanded, onToggle, columnCount }: any) => {
  return (
    <View style={styles.comparisonSection}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionTitleContainer}>
          <MaterialCommunityIcons name={iconName} size={20} color="#003366" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.sectionContent}>
          {data.map((item: any, index: number) => (
            <View key={index} style={[styles.sectionColumn, { flex: 1 }]}>
              {item}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function AIVendorMatchScreen() {
  const { user, accessToken } = useAuth();
  const { city: locationCity } = useLocation();

  const [isSelecting, setIsSelecting] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState<VendorResult[]>([]);
  const [searchResults, setSearchResults] = useState<VendorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'price' | 'name'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['rating', 'price', 'location', 'verified', 'experience', 'event']));
  const [vendorPrices, setVendorPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setSelectedVendors([]); // Clear previous selections when category changes to ensure same-category comparison
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory) {
      handleSearch();
    }
  }, [sortBy]);

  useEffect(() => {
    if (!isSelecting && selectedVendors.length > 0) {
      fetchPricingForSelected();
    }
  }, [isSelecting, selectedVendors]);

  const fetchCategories = async () => {
    try {
      const response = await getCategoryTree();
      if (response.success) {
        // Fetch all categories with type 'business' as requested
        const businessCats = response.categories.filter(c => c.category_type === 'business');
        setCategories(businessCats);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await searchVendors({
        mode: 'filter',
        filters: {
          serviceType: selectedCategory ? [selectedCategory] : undefined,
          vendorName: searchQuery || undefined,
        },
        sortBy: sortBy === 'name' ? 'updated_at' : sortBy === 'reviews' ? 'rating' : sortBy,
        sortOrder: sortBy === 'price' ? 'asc' : 'desc',
        limit: 100
      });

      let results = [...response.results];
      if (sortBy === 'name') {
        results.sort((a, b) => a.business_name.localeCompare(b.business_name));
      } else if (sortBy === 'reviews') {
        results.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingForSelected = async () => {
    const prices: Record<string, string> = {};
    await Promise.all(
      selectedVendors.map(async (v) => {
        try {
          const pResponse = await getBusinessPricing(v.business_id);
          const lowest = getLowestPrice(pResponse.packages);
          prices[v.business_id] = lowest ? `Starts ₹${lowest.toLocaleString('en-IN')}` : 'On request';
        } catch {
          prices[v.business_id] = 'On request';
        }
      })
    );
    setVendorPrices(prices);
  };

  const toggleVendorSelection = (vendor: VendorResult) => {
    const isSelected = selectedVendors.find(v => v.business_id === vendor.business_id);
    if (isSelected) {
      setSelectedVendors(selectedVendors.filter(v => v.business_id !== vendor.business_id));
    } else {
      if (selectedVendors.length < 3) {
        setSelectedVendors([...selectedVendors, vendor]);
      } else {
        // Option to replace or show alert
      }
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderSelectionView = () => (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.selectionHeader} edges={['top']}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Vendors</Text>
          <Text style={styles.selectionCount}>{selectedVendors.length}/3</Text>
        </View>

        <View style={styles.filterSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search in ${selectedCategory || 'category'}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity
              style={[styles.sortTrigger, (showSortOptions || sortBy !== 'rating') && styles.activeSortTrigger]}
              onPress={() => setShowSortOptions(!showSortOptions)}
            >
              <MaterialCommunityIcons name="sort-variant" size={22} color={(showSortOptions || sortBy !== 'rating') ? "#fff" : "#003366"} />
            </TouchableOpacity>
          </View>

          <View style={styles.activeFiltersRow}>
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterLabel}>Sort: </Text>
              <Text style={styles.activeFilterValue}>
                {sortBy === 'rating' ? 'Highest Rating' :
                  sortBy === 'reviews' ? 'Most Reviews' :
                    sortBy === 'price' ? 'Lowest Price' : 'Name (A-Z)'}
              </Text>
            </View>
            {selectedCategory && (
              <View style={[styles.activeFilterBadge, { backgroundColor: '#e6f0ff' }]}>
                <Text style={[styles.activeFilterValue, { color: '#003366' }]}>{selectedCategory}</Text>
              </View>
            )}
          </View>

          {showSortOptions && (
            <View style={styles.sortOptionsRow}>
              {[
                { label: 'Highest Rating', value: 'rating' },
                { label: 'Most Reviews', value: 'reviews' },
                { label: 'Lowest Price', value: 'price' },
                { label: 'Name (A-Z)', value: 'name' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sortChip, sortBy === opt.value && styles.activeSortChip]}
                  onPress={() => { setSortBy(opt.value as any); setShowSortOptions(false); handleSearch(); }}
                >
                  <Text style={[styles.sortChipText, sortBy === opt.value && styles.activeSortChipText]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.servicePickerTrigger}
            onPress={() => setShowServicePicker(true)}
          >
            <View style={styles.servicePickerContent}>
              <MaterialCommunityIcons name="briefcase-outline" size={20} color="#003366" />
              <Text style={[styles.servicePickerText, !selectedCategory && styles.placeholderText]}>
                {selectedCategory || 'Select Service Category'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal
        visible={showServicePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServicePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose a Service</Text>
              <TouchableOpacity onPress={() => setShowServicePicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearch}>
              <Ionicons name="search" size={18} color="#999" />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search services..."
                value={serviceSearch}
                onChangeText={setServiceSearch}
              />
            </View>

            <FlatList
              data={categories.filter(c => c.name.toLowerCase().includes(serviceSearch.toLowerCase()))}
              keyExtractor={(item) => item.id}
              style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedCategory === item.name && styles.activePickerItem]}
                  onPress={() => {
                    setSelectedCategory(item.name);
                    setShowServicePicker(false);
                    setServiceSearch('');
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedCategory === item.name && styles.activePickerItemText]}>
                    {item.name}
                  </Text>
                  {selectedCategory === item.name && <Ionicons name="checkmark" size={20} color="#003366" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {!selectedCategory ? (
        <View style={styles.promptContainer}>
          <MaterialCommunityIcons name="filter-variant" size={60} color="#ddd" />
          <Text style={styles.promptTitle}>Select a Service</Text>
          <Text style={styles.promptText}>Choose a service category above to find vendors for comparison.</Text>
        </View>
      ) : loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#003366" />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.business_id}
          contentContainerStyle={styles.selectionList}
          renderItem={({ item }) => {
            const isSelected = !!selectedVendors.find(v => v.business_id === item.business_id);
            const imageUrl = getMediaUrl(item.cover_photo_url || item.profile_image);
            const initials = getInitials(item.business_name);
            return (
              <TouchableOpacity
                style={[styles.selectionCard, isSelected && styles.selectedCard]}
                onPress={() => toggleVendorSelection(item)}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.selectionImage} />
                ) : (
                  <View style={[styles.selectionImage, styles.initialsContainer]}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.selectionInfo}>
                  <Text style={styles.selectionName}>{item.business_name}</Text>
                  <View style={styles.selectionRating}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.calculated_rating || '0.0'}</Text>
                    <Text style={styles.reviewCountText}> ({item.review_count || 0} reviews)</Text>
                  </View>
                  <Text style={styles.selectionCategory}>{item.business_categories[0]?.name || 'Vendor'}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checked]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          }
        />
      )}

      {selectedVendors.length >= 2 && (
        <View style={styles.selectionFooter}>
          <TouchableOpacity
            style={styles.compareButton}
            onPress={() => setIsSelecting(false)}
          >
            <Text style={styles.compareButtonText}>Compare {selectedVendors.length} Vendors</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderComparisonView = () => (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.header} edges={['top', 'left', 'right']}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setIsSelecting(true)} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Vendors</Text>
        </View>

        <View style={styles.vendorRow}>
          {selectedVendors.map((vendor, idx) => (
            <React.Fragment key={vendor.business_id}>
              {idx > 0 && (
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
              )}
              <VendorCard
                vendor={vendor}
                onRemove={() => {
                  const newSelection = selectedVendors.filter(v => v.business_id !== vendor.business_id);
                  if (newSelection.length < 2) setIsSelecting(true);
                  setSelectedVendors(newSelection);
                }}
              />
            </React.Fragment>
          ))}
          {selectedVendors.length < 3 && (
            <VendorCard isAdd onPress={() => setIsSelecting(true)} />
          )}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ComparisonSection
          title="Rating"
          iconName="star-circle-outline"
          expanded={expandedSections.has('rating')}
          onToggle={() => toggleSection('rating')}
          data={selectedVendors.map(v => {
            const rating = v.calculated_rating != null ? parseFloat(v.calculated_rating.toString()) : NaN;
            return (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingValue}>{!isNaN(rating) ? rating.toFixed(1) : 'N/A'}</Text>
              </View>
            );
          })}
        />

        <ComparisonSection
          title="Price Range"
          iconName="tag-outline"
          expanded={expandedSections.has('price')}
          onToggle={() => toggleSection('price')}
          data={selectedVendors.map(v => (
            <Text style={styles.dataText}>{vendorPrices[v.business_id] || '-'}</Text>
          ))}
        />

        <ComparisonSection
          title="Experience"
          iconName="clock-outline"
          expanded={expandedSections.has('experience')}
          onToggle={() => toggleSection('experience')}
          data={selectedVendors.map(v => (
            <Text style={styles.dataText}>{v.years_experience != null ? `${v.years_experience}+ Years` : 'N/A'}</Text>
          ))}
        />

        <ComparisonSection
          title="Location"
          iconName="map-marker-outline"
          expanded={expandedSections.has('location')}
          onToggle={() => toggleSection('location')}
          data={selectedVendors.map(v => (
            <Text style={styles.dataText}>{v.city || 'N/A'}</Text>
          ))}
        />

        <ComparisonSection
          title="Verified"
          iconName="check-decagram-outline"
          expanded={expandedSections.has('verified')}
          onToggle={() => toggleSection('verified')}
          data={selectedVendors.map(v => (
            <View style={v.verified ? styles.verifiedBadge : styles.notVerifiedBadge}>
              <Ionicons name={v.verified ? "checkmark-circle" : "close-circle"} size={14} color={v.verified ? "#4CAF50" : "#999"} />
              <Text style={[styles.verifiedText, !v.verified && { color: '#999' }]}>{v.verified ? 'Verified' : 'Unverified'}</Text>
            </View>
          ))}
        />

        <ComparisonSection
          title="Event Categories"
          iconName="calendar-star"
          expanded={expandedSections.has('event')}
          onToggle={() => toggleSection('event')}
          data={selectedVendors.map(v => (
            <View style={styles.serviceList}>
              {(v.event_categories || []).map(ec => (
                <Text key={ec.id} style={styles.serviceItem}>{ec.name}</Text>
              ))}
              {(!v.event_categories || v.event_categories.length === 0) && <Text style={styles.dataText}>-</Text>}
            </View>
          ))}
        />

        {/* View Details Buttons Row */}
        <View style={styles.actionRow}>
          {selectedVendors.map(v => (
            <TouchableOpacity 
              key={`details-${v.business_id}`}
              style={styles.viewDetailsButton}
              onPress={() => router.push(`/vendor/${v.business_id}`)}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="arrow-forward" size={12} color="#003366" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => setIsQuoteModalVisible(true)}
        >
          <Text style={styles.primaryButtonText}>Request Quotes ({selectedVendors.length})</Text>
        </TouchableOpacity>
      </View>

      <BulkQuoteModal
        visible={isQuoteModalVisible}
        onClose={() => setIsQuoteModalVisible(false)}
        vendors={selectedVendors}
        user={user}
        accessToken={accessToken}
      />
    </View>
  );

  return isSelecting ? renderSelectionView() : renderComparisonView();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  selectionHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#003366',
    flex: 1,
    marginLeft: 8,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003366',
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterSection: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  sortTrigger: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSortTrigger: {
    backgroundColor: '#003366',
  },
  sortOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeSortChip: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  sortChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeSortChipText: {
    color: '#fff',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  servicePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fb',
    borderWidth: 1.5,
    borderColor: '#e6f0ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginTop: 4,
  },
  servicePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  servicePickerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#003366',
  },
  placeholderText: {
    color: '#999',
    fontWeight: '600',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeChip: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  activeChipText: {
    color: '#fff',
  },
  selectionList: {
    padding: 16,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#003366',
    backgroundColor: '#f0f7ff',
  },
  selectionImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  selectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  selectionRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  cityText: {
    fontSize: 12,
    color: '#666',
  },
  reviewCountText: {
    fontSize: 12,
    color: '#888',
  },
  initialsContainer: {
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  selectionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  compareButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  vendorCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
  },
  vendorImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  addVendorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVendorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addVendorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 2,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999',
  },
  scrollContent: {
    paddingBottom: 150,
  },
  comparisonSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  sectionContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  sectionColumn: {
    alignItems: 'center',
  },
  dataText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4CAF50',
  },
  serviceList: {
    alignItems: 'center',
    gap: 6,
  },
  serviceItem: {
    fontSize: 11,
    fontWeight: '600',
    color: '#003366',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#003366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#003366',
    fontWeight: '700',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeFilterLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterValue: {
    fontSize: 11,
    color: '#333',
    fontWeight: '700',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6f0ff',
    backgroundColor: '#f0f7ff',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003366',
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#003366',
    marginTop: 20,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#003366',
  },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 45,
  },
  pickerSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  activePickerItem: {
    backgroundColor: '#f0f7ff',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  activePickerItemText: {
    color: '#003366',
    fontWeight: '800',
  },
});
