import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { getSavedVendors } from '@/services/savedVendorService';
import { VendorResult } from '@/services/vendorSearchService';
import { ExploreVendorCard } from '@/components/explore/ExploreVendorCard';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeroHeader } from '@/components/navigation/ScreenHeroHeader';

export default function SavedVendorsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [savedVendors, setSavedVendors] = useState<VendorResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSavedVendors();
    }, [user?.id])
  );

  const loadSavedVendors = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const vendors = await getSavedVendors(user.id);
      setSavedVendors(vendors);
    } catch (error) {
      console.error('Error loading saved vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No saved vendors yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the heart icon on any vendor card to save it for later.
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={styles.exploreButtonText}>Explore Vendors</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <ScreenHeroHeader eyebrow="Account" title="Saved Vendors" />

      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={savedVendors}
            keyExtractor={(item) => item.business_id}
            renderItem={({ item }) => (
              <ExploreVendorCard 
                vendor={item} 
                onPress={() => router.push(`/vendor/${item.business_id}`)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
