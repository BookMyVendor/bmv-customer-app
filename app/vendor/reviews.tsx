import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { ScreenHeroHeader } from '@/components/navigation/ScreenHeroHeader';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { listBusinessReviews } from '@/services/reviewService';
import { Review } from '@/types/review.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

function getMediaUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? url.slice(1) : url}`;
}

export default function ReviewsScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      fetchReviews();
    }
  }, [businessId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await listBusinessReviews(businessId);
      setReviews(response.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {item.customer_first_name 
              ? `${item.customer_first_name} ${item.customer_last_name || ''}`.trim()
              : 'Anonymous User'}
          </Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons 
                key={s} 
                name={s <= item.rating ? "star" : "star-outline"} 
                size={14} 
                color="#F5A623" 
              />
            ))}
            <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.reviewText}>{item.review_text}</Text>
      
      {item.media && item.media.length > 0 && (
        <FlatList
          data={item.media}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(m) => m.file_id}
          contentContainerStyle={styles.mediaList}
          renderItem={({ item: media }) => (
            <Image 
              source={{ uri: getMediaUrl(media.url) || getMediaUrl(media.file_path) || '' }} 
              style={styles.reviewImage} 
              contentFit="cover"
            />
          )}
        />
      )}
      
      {item.vendor_response && (
        <View style={styles.vendorResponse}>
          <Text style={styles.responseTitle}>Vendor Response:</Text>
          <Text style={styles.responseText}>{item.vendor_response}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScreenHeroHeader eyebrow="Vendor" title="All Reviews" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#003366" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    marginBottom: 12,
  },
  mediaList: {
    marginBottom: 12,
    gap: 8,
  },
  reviewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 8,
  },
  vendorResponse: {
    backgroundColor: '#F0F5FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
});
