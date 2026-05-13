import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { saveVendor, unsaveVendor, isVendorSaved } from '@/services/savedVendorService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 80) / 3;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

function getMediaUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? url.slice(1) : url}`;
}

interface VendorCardProps {
  image: string | null;
  title: string;
  location: string;
  tag?: string;
  price?: string;
  rating: number | null;
  isVerified?: boolean;
  vendorId?: string;
  onPress?: () => void;
  // Added full vendor object for saving
  fullVendor?: any; 
}

export const VendorCard: React.FC<VendorCardProps> = ({ 
  image, title, location, tag, price, rating, isVerified, vendorId, onPress, fullVendor 
}) => {
  const [liked, setLiked] = useState(false);
  const { user } = useAuth();
  const imageUrl = getMediaUrl(image);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user?.id && vendorId) {
      checkIfSaved();
    }
  }, [user?.id, vendorId]);

  const checkIfSaved = async () => {
    if (user?.id && vendorId) {
      const saved = await isVendorSaved(user.id, vendorId);
      setLiked(saved);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (vendorId) {
      router.push({ pathname: '/vendor/[id]' as any, params: { id: vendorId } });
    }
  };

  const handleLikePress = async () => {
    if (!user?.id || !vendorId) return;

    if (liked) {
      await unsaveVendor(user.id, vendorId);
      setLiked(false);
    } else {
      // Reconstruct vendor object if fullVendor is not provided
      const vendorToSave = fullVendor || {
        business_id: vendorId,
        business_name: title,
        city: location,
        calculated_rating: rating,
        cover_photo_url: image,
        verified: isVerified,
        business_categories: tag ? [{ name: tag }] : [],
      };
      await saveVendor(user.id, vendorToSave);
      setLiked(true);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {imageUrl && !imageError ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image} 
            contentFit="cover" 
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>{getInitials(title)}</Text>
          </View>
        )}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#003366" />
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        )}
        <TouchableOpacity style={styles.heartButton} onPress={handleLikePress}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#FF4D4D" : "#333"} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>
        
        <View style={styles.footer}>
          {tag && (
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.ratingPrice}>
            <Text style={styles.rating}>
              <Ionicons name="star" size={14} color="#F5A623" /> {rating ?? 'N/A'}
            </Text>
            {price && <Text style={styles.price}>{price}</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    marginBottom: 10,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#003366',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingTop: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
  },
  ratingPrice: {
    alignItems: 'flex-end',
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  placeholderImage: {
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
});
