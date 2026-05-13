import { CategoryGrid } from '@/components/explore/CategoryGrid';
import { ExploreHero } from '@/components/explore/ExploreHero';
import { SearchBar } from '@/components/explore/SearchBar';
import { AIPlannerCard } from '@/components/home/AIPlannerCard';
import { ChatFAB } from '@/components/home/ChatFAB';
import { HomeHeader } from '@/components/home/HomeHeader';
import { VendorCard } from '@/components/home/VendorCard';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { getMe } from '@/services/customerService';
import { searchVendors, VendorResult } from '@/services/vendorSearchService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { accessToken } = useAuth();
  const { city: locationCity } = useLocation();
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorResult[]>([]);
  const [effectiveCity, setEffectiveCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifiedVendors();
  }, [accessToken, locationCity]);

  const fetchVerifiedVendors = async () => {
    try {
      setLoading(true);
      let city = locationCity;

      if (accessToken && !city) {
        try {
          const response = await getMe(accessToken);
          if (response.success && response.customer?.city) {
            city = response.customer.city;
          }
        } catch {
          // ignore profile fetch errors, fallback to location city
        }
      }

      setEffectiveCity(city);

      const verifiedResponse = await searchVendors({
        mode: 'filter',
        sortBy: 'rating',
        sortOrder: 'desc',
        filters: {
          verified: true,
          ...(city ? { city } : {}),
        },
      });

      console.log('[HOMESCREEN] Verified vendors:', verifiedResponse.results.length, 'for city:', city);

      let results = verifiedResponse.results;
      const TARGET_COUNT = 6;

      if (results.length < TARGET_COUNT) {
        // Step 2: Try fetching all vendors in the same city (including non-verified)
        const cityVendorsResponse = await searchVendors({
          mode: 'filter',
          sortBy: 'rating',
          sortOrder: 'desc',
          filters: {
            ...(city ? { city } : {}),
          },
        });

        console.log('[HOMESCREEN] City vendors (incl. non-verified):', cityVendorsResponse.results.length);

        const seen = new Set(results.map((v) => v.business_id));
        for (const v of cityVendorsResponse.results) {
          if (!seen.has(v.business_id)) {
            seen.add(v.business_id);
            results.push(v);
            if (results.length >= TARGET_COUNT) break;
          }
        }
      }

      if (results.length < TARGET_COUNT) {
        // Step 3: Fetch vendors from ANY city to fill up to TARGET_COUNT
        const anyCityResponse = await searchVendors({
          mode: 'filter',
          sortBy: 'rating',
          sortOrder: 'desc',
          filters: {}, // No city filter
        });

        console.log('[HOMESCREEN] Fallback vendors from other cities:', anyCityResponse.results.length);

        const seen = new Set(results.map((v) => v.business_id));
        for (const v of anyCityResponse.results) {
          if (!seen.has(v.business_id)) {
            seen.add(v.business_id);
            results.push(v);
            if (results.length >= TARGET_COUNT) break;
          }
        }
      }

      console.log('[HOMESCREEN] Total vendors to display:', results.length);
      setVendors(results);
    } catch (error) {
      console.error('Failed to fetch verified vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HomeHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ExploreHero />
        <SearchBar />
        <CategoryGrid />
        <AIPlannerCard />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verified Vendors</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/explore', params: { fromDashboard: 'true', city: effectiveCity || '' } })}>
            <Text style={styles.exploreText}>EXPLORE</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003366" />
          </View>
        ) : (
          <FlatList
            data={vendors}
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            keyExtractor={(item) => item.business_id}
            contentContainerStyle={styles.vendorList}
            style={styles.vendorFlatList}
            renderItem={({ item }) => (
              <VendorCard
                image={item.cover_photo_url || item.profile_image}
                title={item.business_name}
                location={item.city || 'Location not specified'}
                tag={item.business_categories[0]?.name}
                rating={item.calculated_rating}
                isVerified={item.verified}
                vendorId={item.business_id}
              />
            )}
          />
        )}
      </ScrollView>

      <ChatFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  exploreText: {
    fontSize: 13,
    color: '#003366',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vendorList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  vendorFlatList: {
    minHeight: 220,
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


