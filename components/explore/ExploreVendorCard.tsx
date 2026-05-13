import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { VendorResult } from '@/services/vendorSearchService';
import { getBusinessPricing, getLowestPrice } from '@/services/pricingService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

function getMediaUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? url.slice(1) : url}`;
}

interface ExploreVendorCardProps {
  vendor: VendorResult;
  basePrice?: number | null;
  onPress?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return 'Price on request';
  return `₹${price.toLocaleString('en-IN')}`;
}

function formatRating(rating: number | string | null | undefined): string {
  if (rating == null) return 'N/A';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (typeof numRating !== 'number' || isNaN(numRating)) return 'N/A';
  return numRating.toFixed(1);
}

export const ExploreVendorCard: React.FC<ExploreVendorCardProps> = ({
  vendor,
  basePrice,
  onPress
}) => {
  const [liked, setLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [internalPrice, setInternalPrice] = useState<number | null>(basePrice ?? null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (basePrice !== undefined) {
      setInternalPrice(basePrice);
      return;
    }

    const fetchPrice = async () => {
      try {
        setLoadingPrice(true);
        const pricingResponse = await getBusinessPricing(vendor.business_id);
        const lowestPrice = getLowestPrice(pricingResponse.packages);
        setInternalPrice(lowestPrice);
      } catch (err) {
        console.error(`Failed to fetch pricing for ${vendor.business_id}:`, err);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [vendor.business_id, basePrice]);
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/vendor/${vendor.business_id}`);
    }
  };
  
  const coverImage = getMediaUrl(vendor.cover_photo_url);
  const hasImage = !!coverImage && !imageError;
  const initials = getInitials(vendor.business_name);
  const parentCategory = vendor.business_categories.length > 0 
    ? vendor.business_categories[0].name 
    : 'Vendor';
  const rating = vendor.calculated_rating;
  const city = vendor.city || 'Location not specified';

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {hasImage ? (
          <Image 
            source={{ uri: coverImage }} 
            style={styles.image} 
            contentFit="cover" 
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.image, styles.initialsContainer]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.heartButton} onPress={() => setLiked(!liked)}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? "#FF4D4D" : "#333"} />
        </TouchableOpacity>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#F5A623" />
          <Text style={styles.ratingText}>{formatRating(rating)}</Text>
        </View>
        {vendor.featured && (
          <View style={styles.premiumTag}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{vendor.business_name}</Text>
          {vendor.verified && (
            <Ionicons name="checkmark-circle" size={18} color="#C8A000" />
          )}
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color="#666" />
          <Text style={styles.locationText}>{city}</Text>
        </View>

        <Text style={styles.tagText}>{parentCategory}</Text>
        <View style={styles.priceRow}>
          {loadingPrice ? (
            <ActivityIndicator size="small" color="#003366" />
          ) : (
            <Text style={styles.priceText}>{formatPrice(internalPrice)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    flexDirection: 'row',
  },
  imageContainer: {
    width: 130,
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  initialsContainer: {
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  premiumTag: {
    position: 'absolute',
    right: 0,
    top: 36,
    bottom: 36,
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: '#C8A000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    letterSpacing: 0.5,
    overflow: 'hidden',
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
    width: 70,
  },
  content: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  tagText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
});
