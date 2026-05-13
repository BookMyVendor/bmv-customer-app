import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { searchVendors, VendorResult } from '@/services/vendorSearchService';
import { getBusinessPricing, Package } from '@/services/pricingService';
import { listBusinessReviews, listCustomerReviews } from '@/services/reviewService';
import { Review } from '@/types/review.types';
import ReviewModal from '../../components/vendor/ReviewModal';
import QuoteModal from '../../components/vendor/QuoteModal';

const { width } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

function getMediaUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `${API_URL}${cleanUrl}`;
}

function formatRating(rating: number | string | null | undefined): string {
  if (rating == null) return 'N/A';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (typeof numRating !== 'number' || isNaN(numRating)) return 'N/A';
  return numRating.toFixed(1);
}

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, user } = useAuth();

  const [vendor, setVendor] = useState<VendorResult | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        searchVendors({ mode: 'filter', filters: { businessIds: [id] } }),
        getBusinessPricing(id),
        listBusinessReviews(id),
      ];

      // Add customer reviews fetch if logged in
      if (accessToken) {
        promises.push(listCustomerReviews(accessToken));
      }

      const [vendorRes, pricingRes, reviewsRes, customerReviewsRes] = await Promise.all(promises);

      if (vendorRes.results.length > 0) {
        setVendor(vendorRes.results[0]);
      }
      setPackages(pricingRes.packages);
      
      const allReviews = reviewsRes.reviews || [];
      setReviews(allReviews);

      // If we have customer reviews, we can see if this vendor was already reviewed by the user
      if (customerReviewsRes?.success && customerReviewsRes.reviews) {
        const existingReview = customerReviewsRes.reviews.find((r: Review) => r.business_id === id);
        if (existingReview) {
          console.log('[VENDOR DETAIL] Found existing review by user for this vendor');
          setUserReview(existingReview);
        } else {
          setUserReview(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSocial = (url: string | null | undefined) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.centered}>
        <Text>Vendor not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = [
    vendor.cover_photo_url || vendor.profile_image,
    ...(vendor.business_images || []),
  ].filter(Boolean) as string[];

  const featuredReview = reviews.length > 0 ? reviews[0] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Exact Match of AI Budget Planner/Compare Vendors Header Structure */}
      <SafeAreaView style={styles.header} edges={['top', 'left', 'right']}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setCurrentImageIndex(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: getMediaUrl(img) || '' }}
                style={styles.carouselImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.imageIndicator}>
            <Text style={styles.indicatorText}>{currentImageIndex + 1}/{images.length || 1}</Text>
          </View>
        </View>

        {/* Vendor Main Info */}
        <View style={styles.infoSection}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryBadge}>{vendor.business_categories[0]?.name || 'Vendor'}</Text>
            {vendor.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#C8A000" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.vendorName}>{vendor.business_name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#000" />
              <Text style={styles.ratingText}>{formatRating(vendor.calculated_rating)}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color="#003366" />
            <Text style={styles.locationText}>
              {vendor.address ? `${vendor.address}, ` : ''}{vendor.city}, {vendor.state}
            </Text>
          </View>

          {vendor.years_experience != null && (
            <View style={styles.experienceRow}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.experienceText}>{vendor.years_experience} Years Experience</Text>
            </View>
          )}

          {/* Social Media Section */}
          <View style={styles.socialContainer}>
            <Text style={styles.sectionTitleSmall}>Social Media</Text>
            <View style={styles.socialRow}>
              {vendor.website_url && (
                <TouchableOpacity style={styles.socialIcon} onPress={() => handleOpenSocial(vendor.website_url)}>
                  <Ionicons name="globe-outline" size={24} color="#003366" />
                </TouchableOpacity>
              )}
              {vendor.instagram_url && (
                <TouchableOpacity style={styles.socialIcon} onPress={() => handleOpenSocial(vendor.instagram_url)}>
                  <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                </TouchableOpacity>
              )}
              {vendor.facebook_url && (
                <TouchableOpacity style={styles.socialIcon} onPress={() => handleOpenSocial(vendor.facebook_url)}>
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
              )}
              {vendor.youtube_url && (
                <TouchableOpacity style={styles.socialIcon} onPress={() => handleOpenSocial(vendor.youtube_url)}>
                  <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* About Section */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{vendor.description || 'No description available.'}</Text>
          </View>
        </View>

        {/* Service Packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Service Packages</Text>
          {packages.map((pkg) => (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={styles.packageIconContainer}>
                <Ionicons 
                  name={pkg.name.toLowerCase().includes('floral') ? 'flower-outline' : 'calendar-outline'} 
                  size={24} 
                  color="#003366" 
                />
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packageDesc} numberOfLines={2}>{pkg.description}</Text>
              </View>
              <View style={styles.packagePriceContainer}>
                <Text style={styles.packagePrice}>₹{pkg.price.toLocaleString('en-IN')}</Text>
                <Text style={styles.priceLabel}>BASE PRICE</Text>
              </View>
            </View>
          ))}
        </View>

          {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            <TouchableOpacity onPress={() => router.push(`/vendor/reviews?businessId=${id}`)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ratingSummaryCard}>
            <Text style={styles.largeRating}>{formatRating(vendor.calculated_rating)}</Text>
            <View style={styles.summaryStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons 
                  key={s} 
                  name={s <= (vendor.calculated_rating || 0) ? "star" : "star-outline"} 
                  size={20} 
                  color="#8B8000" 
                />
              ))}
            </View>
            <Text style={styles.verifiedBookingsText}>Based on {vendor.review_count || 0} verified reviews</Text>
          </View>

          {/* User's Own Review */}
          {userReview && (
            <View style={styles.userReviewCard}>
              <View style={styles.userReviewHeader}>
                <Text style={styles.yourReviewTitle}>Your Review</Text>
                <View style={styles.userRatingBadge}>
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={styles.userRatingText}>{userReview.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>"{userReview.review_text}"</Text>
              <Text style={styles.reviewDate}>
                Posted on {new Date(userReview.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Featured Review (Other users) - only show if it's not the user's own review */}
          {featuredReview && (!userReview || featuredReview.id !== userReview.id) && (
            <View style={styles.featuredReview}>
              <View style={styles.reviewerHeader}>
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>
                    {featuredReview.customer_first_name 
                      ? `${featuredReview.customer_first_name} ${featuredReview.customer_last_name || ''}`.trim()
                      : 'Anonymous User'}
                  </Text>
                  <Text style={styles.reviewMeta}>
                    {new Date(featuredReview.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewText}>"{featuredReview.review_text}"</Text>
              
              {featuredReview.media && featuredReview.media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewMediaScroll}>
                  {featuredReview.media.map((m) => (
                    <Image 
                      key={m.file_id}
                      source={{ uri: getMediaUrl(m.url) || '' }} 
                      style={styles.reviewThumbnail} 
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.addReviewButton} 
            onPress={() => setIsReviewModalVisible(true)}
          >
            <Ionicons name={userReview ? "create" : "create-outline"} size={20} color="#003366" />
            <Text style={styles.addReviewText}>{userReview ? 'Edit Your Review' : 'Write a Review'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <SafeAreaView style={styles.bottomBarContainer} edges={['bottom']}>
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.quoteButton}
            onPress={() => setIsQuoteModalVisible(true)}
          >
            <Text style={styles.quoteButtonText}>Get Quote</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ReviewModal
        visible={isReviewModalVisible}
        onClose={() => setIsReviewModalVisible(false)}
        businessId={vendor.business_id}
        vendorId={vendor.vendor_id}
        accessToken={accessToken}
        authUser={user}
        onSuccess={fetchData}
        initialReview={userReview}
      />

      <QuoteModal
        visible={isQuoteModalVisible}
        onClose={() => setIsQuoteModalVisible(false)}
        businessId={vendor.business_id}
        vendorId={vendor.vendor_id}
        vendorName={vendor.business_name}
        user={user}
        accessToken={accessToken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  scrollContent: {
    paddingBottom: 100,
  },
  carouselContainer: {
    height: 320,
    position: 'relative',
    backgroundColor: '#000',
  },
  carouselImage: {
    width: width,
    height: 320,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#F0F5FF',
    color: '#003366',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#C8A000',
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  experienceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  socialContainer: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 20,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  aboutSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
  packagesSection: {
    padding: 20,
    backgroundColor: '#F8F9FB',
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  packageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  packagePriceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  priceLabel: {
    fontSize: 9,
    color: '#999',
    fontWeight: '700',
    marginTop: 2,
  },
  reviewsSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
  ratingSummaryCard: {
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  largeRating: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  summaryStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  verifiedBookingsText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  featuredReview: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  reviewMeta: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reviewMediaScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  reviewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#003366',
    borderRadius: 14,
    gap: 8,
  },
  addReviewText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003366',
  },
  userReviewCard: {
    backgroundColor: '#F0F5FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D1E0FF',
  },
  userReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  yourReviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#003366',
  },
  userRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  userRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  bottomBarContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quoteButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  quoteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backButtonLarge: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#003366',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
