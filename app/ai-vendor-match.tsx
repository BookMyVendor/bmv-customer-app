import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  BackHandler,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { HeroBackButton } from '@/components/navigation/ScreenHeroHeader';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { searchVendors, VendorResult } from '@/services/vendorSearchService';
import { getCategoryTree } from '@/services/categoryService';
import { CategoryTreeNode } from '@/types/category.types';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import BulkQuoteModal from '@/components/vendor/BulkQuoteModal';
import { getBusinessPricing, getLowestPrice } from '@/services/pricingService';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';
/** Max event category chips per vendor column; remainder shown as "+n more". */
const MAX_EVENT_CHIPS = 3;

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

type VendorCardProps = {
  vendor?: VendorResult;
  onRemove?: () => void;
  isAdd?: boolean;
  onPress?: () => void;
  onProfilePress?: () => void;
};

const VendorCard = ({ vendor, onRemove, isAdd, onPress, onProfilePress }: VendorCardProps) => {
  if (isAdd) {
    return (
      <Pressable
        style={({ pressed }) => [styles.vendorCard, styles.vendorCardAdd, pressed && styles.vendorCardPressed]}
        onPress={onPress}
      >
        <View style={styles.addVendorContent}>
          <View style={styles.addVendorIcon}>
            <Ionicons name="add" size={22} color="#6366F1" />
          </View>
          <Text style={styles.addVendorText}>Add vendor</Text>
        </View>
      </Pressable>
    );
  }

  if (!vendor) return null;

  const imageUrl = getMediaUrl(vendor.cover_photo_url || vendor.profile_image);
  const initials = getInitials(vendor.business_name);

  return (
    <View style={styles.vendorCard}>
      <Pressable
        hitSlop={8}
        style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.7 }]}
        onPress={onRemove}
      >
        <View style={styles.removeButtonInner}>
          <Ionicons name="close" size={14} color="#fff" />
        </View>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.vendorProfileTap, pressed && styles.vendorProfileTapPressed]}
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${vendor.business_name} profile`}
      >
        <View style={styles.vendorAvatarRing}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.vendorImage} />
          ) : (
            <View style={[styles.vendorImage, styles.initialsContainer]}>
              <Text style={styles.initialsTextSmall}>{initials}</Text>
            </View>
          )}
        </View>
        <Text style={styles.vendorName} numberOfLines={2}>
          {vendor.business_name}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={13} color="#FBBF24" />
          <Text style={styles.compareRatingText}>{vendor.calculated_rating || '0.0'}</Text>
        </View>
      </Pressable>
    </View>
  );
};

type ComparisonSectionProps = {
  title: string;
  iconName: string;
  data: React.ReactNode[];
  expanded: boolean;
  onToggle: () => void;
  cellStyle?: StyleProp<ViewStyle>;
};

const ComparisonSection = ({ title, iconName, data, expanded, onToggle, cellStyle }: ComparisonSectionProps) => {
  return (
    <View style={styles.comparisonSectionCard}>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionTitleRow}>
          <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.sectionIconWrap}>
            <MaterialCommunityIcons name={iconName as any} size={20} color="#3730A3" />
          </LinearGradient>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={[styles.chevronPill, expanded && styles.chevronPillOpen]}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#475569" />
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.sectionContent}>
          {data.map((item, index) => (
            <View key={index} style={styles.sectionColumn}>
              <View style={[styles.sectionCell, cellStyle]}>{item}</View>
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

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

  /** Compare step: system back / swipe should return to vendor pick, not AI Tools. */
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!isSelecting) {
        e.preventDefault();
        setIsSelecting(true);
      }
    });
    return unsub;
  }, [navigation, isSelecting]);

  useFocusEffect(
    useCallback(() => {
      if (isSelecting) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setIsSelecting(true);
        return true;
      });
      return () => sub.remove();
    }, [isSelecting])
  );

  const handleSearch = useCallback(async () => {
    if (!selectedCategory) return;
    try {
      setLoading(true);
      const response = await searchVendors({
        mode: 'filter',
        filters: {
          serviceType: [selectedCategory],
          vendorName: searchQuery.trim() || undefined,
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
  }, [selectedCategory, searchQuery, sortBy]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const selectCategory = useCallback((name: string) => {
    setSelectedCategory(name);
    setSearchQuery('');
  }, []);

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
  }, [selectedCategory, handleSearch]);

  useEffect(() => {
    if (!selectedCategory) return;
    const timer = setTimeout(() => handleSearch(), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, handleSearch]);

  useEffect(() => {
    if (selectedCategory) {
      handleSearch();
    }
  }, [sortBy, selectedCategory, handleSearch]);

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
    <View style={styles.selectionRoot}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <LinearGradient
        colors={['#FFFBFF', '#F5F3FF', '#EEF2FF', '#E0F2FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.selectionHero}
      >
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.selectionHeroTop}>
            <HeroBackButton />
            <View style={styles.selectionHeroTitles}>
              <Text style={styles.selectionHeroKicker}>Compare vendors</Text>
              <Text style={styles.selectionHeroTitle}>Pick who to compare</Text>
            </View>
            <View style={styles.selectionHeroBadge}>
              <Text style={styles.selectionHeroBadgeNum}>{selectedVendors.length}</Text>
              <Text style={styles.selectionHeroBadgeCap}>/3</Text>
            </View>
          </View>
          <Text style={styles.selectionHeroHint}>Select a service, search, then choose up to three businesses.</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.selectionSheet}>
        <View style={styles.selectionFiltersCard}>
          <View style={styles.searchRow}>
            <View style={styles.selectionSearchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                style={styles.selectionSearchInput}
                placeholder={selectedCategory ? `Search vendors in ${selectedCategory}…` : 'Search service categories…'}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  if (selectedCategory) handleSearch();
                }}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={[styles.selectionSortBtn, (showSortOptions || sortBy !== 'rating') && styles.selectionSortBtnActive]}
              onPress={() => setShowSortOptions(!showSortOptions)}
            >
              <MaterialCommunityIcons
                name="sort-variant"
                size={22}
                color={showSortOptions || sortBy !== 'rating' ? '#fff' : '#4F46E5'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.activeFiltersRow}>
            <View style={styles.selectionMetaChip}>
              <MaterialCommunityIcons name="sort-clock-descending-outline" size={14} color="#64748B" />
              <Text style={styles.selectionMetaChipText}>
                {sortBy === 'rating' ? 'Top rated' : sortBy === 'reviews' ? 'Most reviews' : sortBy === 'price' ? 'Lowest price' : 'Name A–Z'}
              </Text>
            </View>
            {selectedCategory ? (
              <View style={styles.selectionMetaChipAccent}>
                <MaterialCommunityIcons name="briefcase-check-outline" size={14} color="#4338CA" />
                <Text style={styles.selectionMetaChipAccentText} numberOfLines={1}>
                  {selectedCategory}
                </Text>
              </View>
            ) : null}
          </View>

          {showSortOptions ? (
            <View style={styles.sortOptionsWrap}>
              {[
                { label: 'Highest rating', value: 'rating' },
                { label: 'Most reviews', value: 'reviews' },
                { label: 'Lowest price', value: 'price' },
                { label: 'Name (A–Z)', value: 'name' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sortChipModern, sortBy === opt.value && styles.sortChipModernActive]}
                  onPress={() => {
                    setSortBy(opt.value as 'rating' | 'reviews' | 'price' | 'name');
                    setShowSortOptions(false);
                    handleSearch();
                  }}
                >
                  <Text style={[styles.sortChipModernText, sortBy === opt.value && styles.sortChipModernTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Pressable style={({ pressed }) => [styles.servicePickerModern, pressed && { opacity: 0.92 }]} onPress={() => setShowServicePicker(true)}>
            <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.servicePickerIconBg}>
              <MaterialCommunityIcons name="shape-outline" size={22} color="#4338CA" />
            </LinearGradient>
            <View style={styles.servicePickerTextCol}>
              <Text style={styles.servicePickerLabel}>Service type</Text>
              <Text style={[styles.servicePickerValue, !selectedCategory && styles.servicePickerPlaceholder]} numberOfLines={1}>
                {selectedCategory || 'Tap to choose category'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        </View>

        {!selectedCategory ? (
          searchQuery.trim() ? (
            <FlatList
              style={styles.selectionFlatList}
              data={filteredCategories}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.selectionList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItemModern}
                  onPress={() => selectCategory(item.name)}
                >
                  <Text style={styles.pickerItemTextModern}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyModern}>
                  <MaterialCommunityIcons name="shape-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyModernTitle}>No categories found</Text>
                  <Text style={styles.emptyModernSub}>Try a different name or pick from the service list below.</Text>
                </View>
              }
            />
          ) : (
            <View style={styles.selectionBodyFill}>
              <View style={styles.promptCard}>
                <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.promptIconRing}>
                  <MaterialCommunityIcons name="gesture-tap-hold" size={36} color="#fff" />
                </LinearGradient>
                <Text style={styles.promptTitleModern}>Start with a category</Text>
                <Text style={styles.promptTextModern}>
                  Search for a service type above, or tap Service type below. Then pick vendors to compare.
                </Text>
              </View>
            </View>
          )
        ) : loading ? (
          <View style={styles.selectionBodyFill}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingHint}>Finding vendors…</Text>
          </View>
        ) : (
          <FlatList
            style={styles.selectionFlatList}
            data={searchResults}
            keyExtractor={item => item.business_id}
            contentContainerStyle={[
              styles.selectionList,
              { paddingBottom: selectedVendors.length >= 2 ? 108 + insets.bottom : 28 },
            ]}
            renderItem={({ item }) => {
              const isSelected = !!selectedVendors.find(v => v.business_id === item.business_id);
              const imageUrl = getMediaUrl(item.cover_photo_url || item.profile_image);
              const initials = getInitials(item.business_name);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.selectionCardModern,
                    isSelected && styles.selectionCardModernSelected,
                    pressed && styles.selectionCardModernPressed,
                  ]}
                  onPress={() => toggleVendorSelection(item)}
                >
                  <View style={[styles.selectionImageWrap, isSelected && styles.selectionImageWrapSelected]}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.selectionImageModern} />
                    ) : (
                      <View style={[styles.selectionImageModern, styles.initialsContainerModern]}>
                        <Text style={styles.initialsText}>{initials}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.selectionInfo}>
                    <Text style={styles.selectionNameModern} numberOfLines={2}>
                      {item.business_name}
                    </Text>
                    <View style={styles.selectionRatingModern}>
                      <Ionicons name="star" size={14} color="#FBBF24" />
                      <Text style={styles.selectionRatingNum}>{item.calculated_rating || '0.0'}</Text>
                      <Text style={styles.reviewCountTextModern}>{item.review_count ?? 0} reviews</Text>
                    </View>
                    <Text style={styles.selectionCategoryModern} numberOfLines={1}>
                      {item.business_categories[0]?.name || 'Vendor'}
                    </Text>
                  </View>
                  <View style={[styles.checkboxModern, isSelected && styles.checkboxModernChecked]}>
                    {isSelected ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyModern}>
                <MaterialCommunityIcons name="store-search-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyModernTitle}>No vendors found</Text>
                <Text style={styles.emptyModernSub}>Try another search or pick a different category.</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={showServicePicker} transparent animationType="slide" onRequestClose={() => setShowServicePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeaderModern}>
              <Text style={styles.pickerTitleModern}>Choose a service</Text>
              <TouchableOpacity onPress={() => setShowServicePicker(false)} style={styles.pickerCloseBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearchModern}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search services…"
                placeholderTextColor="#94A3B8"
                value={serviceSearch}
                onChangeText={setServiceSearch}
              />
            </View>

            <FlatList
              data={categories.filter(c => c.name.toLowerCase().includes(serviceSearch.toLowerCase()))}
              keyExtractor={item => item.id}
              style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItemModern, selectedCategory === item.name && styles.pickerItemModernActive]}
                  onPress={() => {
                    selectCategory(item.name);
                    setShowServicePicker(false);
                    setServiceSearch('');
                  }}
                >
                  <Text style={[styles.pickerItemTextModern, selectedCategory === item.name && styles.pickerItemTextModernActive]}>{item.name}</Text>
                  {selectedCategory === item.name ? <Ionicons name="checkmark-circle" size={22} color="#4F46E5" /> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {selectedVendors.length >= 2 ? (
        <View style={[styles.selectionFooter, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}>
          <TouchableOpacity style={styles.selectionCompareWrap} onPress={() => setIsSelecting(false)} activeOpacity={0.92}>
            <LinearGradient colors={['#4F46E5', '#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.selectionCompareGradient}>
              <Text style={styles.selectionCompareText}>Compare {selectedVendors.length} vendors</Text>
              <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderComparisonView = () => (
    <View style={styles.compareRoot}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <LinearGradient
        colors={['#FFFBFF', '#F5F3FF', '#EEF2FF', '#E0F2FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.compareHero}
      >
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.compareHeroTop}>
            <HeroBackButton onPress={() => setIsSelecting(true)} />
            <View style={styles.compareHeroTitles}>
              <Text style={styles.compareHeroKicker}>Side by side</Text>
              <Text style={styles.compareHeroTitle}>Compare vendors</Text>
            </View>
            <View style={styles.compareHeroBadge}>
              <Text style={styles.compareHeroBadgeText}>{selectedVendors.length}</Text>
            </View>
          </View>

          <Text style={styles.compareHeroSubtitle}>Tap a business photo or name to open their full profile.</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vendorRowScroll}
            style={styles.vendorRowScrollView}
          >
            {selectedVendors.map((vendor, idx) => (
              <React.Fragment key={vendor.business_id}>
                {idx > 0 && (
                  <View style={styles.vsWrap}>
                    <LinearGradient colors={['#EEF2FF', '#FFFFFF']} style={styles.vsPill}>
                      <Text style={styles.vsText}>vs</Text>
                    </LinearGradient>
                  </View>
                )}
                <VendorCard
                  vendor={vendor}
                  onProfilePress={() => router.push(`/vendor/${vendor.business_id}`)}
                  onRemove={() => {
                    const newSelection = selectedVendors.filter(v => v.business_id !== vendor.business_id);
                    if (newSelection.length < 2) setIsSelecting(true);
                    setSelectedVendors(newSelection);
                  }}
                />
              </React.Fragment>
            ))}
            {selectedVendors.length < 3 && <VendorCard isAdd onPress={() => setIsSelecting(true)} />}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
      >
        <ComparisonSection
          title="Rating"
          iconName="star-circle-outline"
          expanded={expandedSections.has('rating')}
          onToggle={() => toggleSection('rating')}
          data={selectedVendors.map(v => {
            const rating = v.calculated_rating != null ? parseFloat(v.calculated_rating.toString()) : NaN;
            return (
              <View key={v.business_id} style={styles.ratingRow}>
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
            <Text key={v.business_id} style={styles.dataText}>{vendorPrices[v.business_id] || '-'}</Text>
          ))}
        />

        <ComparisonSection
          title="Experience"
          iconName="clock-outline"
          expanded={expandedSections.has('experience')}
          onToggle={() => toggleSection('experience')}
          data={selectedVendors.map(v => (
            <Text key={v.business_id} style={styles.dataText}>{v.years_experience != null ? `${v.years_experience}+ Years` : 'N/A'}</Text>
          ))}
        />

        <ComparisonSection
          title="Location"
          iconName="map-marker-outline"
          expanded={expandedSections.has('location')}
          onToggle={() => toggleSection('location')}
          data={selectedVendors.map(v => (
            <Text key={v.business_id} style={styles.dataText}>{v.city || 'N/A'}</Text>
          ))}
        />

        <ComparisonSection
          title="Verified"
          iconName="check-decagram-outline"
          expanded={expandedSections.has('verified')}
          onToggle={() => toggleSection('verified')}
          data={selectedVendors.map(v => (
            <View key={v.business_id} style={v.verified ? styles.verifiedBadge : styles.notVerifiedBadge}>
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
          cellStyle={styles.sectionCellEvent}
          data={selectedVendors.map(v => {
            const cats = v.event_categories || [];
            const visible = cats.slice(0, MAX_EVENT_CHIPS);
            const moreCount = Math.max(0, cats.length - MAX_EVENT_CHIPS);
            return (
              <View key={v.business_id} style={styles.eventChipGrid}>
                {visible.map(ec => (
                  <View key={ec.id} style={styles.eventChip}>
                    <Text style={styles.eventChipText} numberOfLines={2}>
                      {ec.name}
                    </Text>
                  </View>
                ))}
                {moreCount > 0 && (
                  <View style={styles.eventChipMore}>
                    <Text style={styles.eventChipMoreText}>+{moreCount} more</Text>
                  </View>
                )}
                {cats.length === 0 && <Text style={styles.eventEmptyText}>—</Text>}
              </View>
            );
          })}
        />

        <View style={styles.actionRow}>
          {selectedVendors.map(v => (
            <TouchableOpacity
              key={`details-${v.business_id}`}
              style={styles.viewDetailsButton}
              onPress={() => router.push(`/vendor/${v.business_id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.viewDetailsText}>View details</Text>
              <Ionicons name="arrow-forward-circle" size={18} color="#4F46E5" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <TouchableOpacity style={styles.primaryButtonWrap} onPress={() => setIsQuoteModalVisible(true)} activeOpacity={0.9}>
          <LinearGradient
            colors={['#4F46E5', '#6366F1', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Request quotes · {selectedVendors.length}</Text>
          </LinearGradient>
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
  selectionRoot: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  selectionHero: {
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.25)',
  },
  selectionHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 12,
  },
  selectionHeroTitles: {
    flex: 1,
  },
  selectionHeroKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  selectionHeroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.35,
  },
  selectionHeroBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  selectionHeroBadgeNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#4338CA',
  },
  selectionHeroBadgeCap: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 1,
  },
  selectionHeroHint: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  selectionSheet: {
    flex: 1,
    marginTop: -16,
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
  },
  selectionFiltersCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectionSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectionSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  selectionSortBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  selectionSortBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectionMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '48%',
  },
  selectionMetaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  selectionMetaChipAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flex: 1,
    minWidth: 0,
  },
  selectionMetaChipAccentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
    flex: 1,
  },
  sortOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  sortChipModern: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortChipModernActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  sortChipModernText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sortChipModernTextActive: {
    color: '#fff',
  },
  servicePickerModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  servicePickerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicePickerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  servicePickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  servicePickerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  servicePickerPlaceholder: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  selectionBodyFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 200,
  },
  selectionFlatList: {
    flex: 1,
  },
  selectionList: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  promptCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  promptIconRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  promptTitleModern: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  promptTextModern: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
  },
  loadingHint: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  selectionCardModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectionCardModernSelected: {
    borderColor: '#818CF8',
    backgroundColor: '#F5F3FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.12,
  },
  selectionCardModernPressed: {
    opacity: 0.96,
  },
  selectionImageWrap: {
    borderRadius: 16,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectionImageWrapSelected: {
    borderColor: '#6366F1',
  },
  selectionImageModern: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  initialsContainerModern: {
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  selectionNameModern: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  selectionRatingModern: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  selectionRatingNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  reviewCountTextModern: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginLeft: 2,
  },
  selectionCategoryModern: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 4,
  },
  checkboxModern: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkboxModernChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  emptyModern: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyModernTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#475569',
    marginTop: 12,
  },
  emptyModernSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  selectionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  selectionCompareWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  selectionCompareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  selectionCompareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pickerHeaderModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerTitleModern: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSearchModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerItemModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pickerItemModernActive: {
    backgroundColor: '#F5F3FF',
  },
  pickerItemTextModern: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  pickerItemTextModernActive: {
    color: '#4338CA',
    fontWeight: '800',
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
  compareRoot: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  compareHero: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.25)',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  compareHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  compareHeroTitles: {
    flex: 1,
  },
  compareHeroKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  compareHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  compareHeroBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  compareHeroBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4338CA',
  },
  compareHeroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  vendorRowScrollView: {
    maxHeight: 200,
  },
  vendorRowScroll: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 10,
  },
  vsWrap: {
    justifyContent: 'center',
    paddingVertical: 24,
  },
  vsPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(199, 210, 254, 0.9)',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  vendorCard: {
    width: (width - 32 - 40) / 3,
    minWidth: 108,
    maxWidth: 132,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  vendorCardAdd: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  vendorCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 4,
  },
  removeButtonInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  vendorProfileTap: {
    alignItems: 'center',
    width: '100%',
  },
  vendorProfileTapPressed: {
    opacity: 0.85,
  },
  vendorAvatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.35)',
    marginBottom: 8,
  },
  vendorImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  vendorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 15,
    minHeight: 30,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  compareRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },
  addVendorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addVendorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addVendorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  initialsTextSmall: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 0,
  },
  comparisonSectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAFBFC',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  chevronPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronPillOpen: {
    backgroundColor: '#EEF2FF',
  },
  sectionContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionColumn: {
    flex: 1,
    minWidth: 0,
  },
  sectionCell: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  sectionCellEvent: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    minHeight: 96,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  dataText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  notVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  eventChipGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'flex-start',
    gap: 6,
  },
  eventChip: {
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  eventChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
    textAlign: 'center',
    lineHeight: 14,
  },
  eventChipMore: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  eventChipMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: -0.1,
  },
  eventEmptyText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    paddingVertical: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  primaryButtonWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    backgroundColor: '#FFFFFF',
    gap: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
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
