import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { HeroBackButton } from '@/components/navigation/ScreenHeroHeader';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { searchVendors, VendorResult } from '@/services/vendorSearchService';
import { getBusinessPricing, Package } from '@/services/pricingService';
import { listBusinessReviews, listCustomerReviews } from '@/services/reviewService';
import { Review } from '@/types/review.types';
import ReviewModal from '../../components/vendor/ReviewModal';
import QuoteModal from '../../components/vendor/QuoteModal';
import { resolveVendorReviewDisplay, starFillCount } from '@/utils/reviewStats';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 340;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

function getMediaUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `${API_URL}${cleanUrl}`;
}

function formatRating(rating: number | string | null | undefined): string {
  if (rating == null) return '—';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (typeof numRating !== 'number' || isNaN(numRating)) return '—';
  return numRating.toFixed(1);
}

/** Same file / path after resolving API base — avoids cover appearing again in gallery */
function mediaKey(url: string | null | undefined): string {
  if (!url || !String(url).trim()) return '';
  const resolved = (getMediaUrl(url) || url).trim();
  const path = resolved.split('?')[0].toLowerCase().replace(/\\/g, '/');
  return path.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '');
}

function isVideoUrl(url: string): boolean {
  const p = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|mov|m3u8|mkv|avi)(\?|$)/i.test(p);
}

/** DB sometimes stores description as stringified `{ originalDescription, portfolioImages }`. */
function getVendorAboutText(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return '';
  const s = String(raw).trim();
  if (!s.startsWith('{')) return s;
  try {
    const parsed = JSON.parse(s) as Record<string, unknown>;
    if (
      parsed &&
      typeof parsed === 'object' &&
      ('originalDescription' in parsed || 'portfolioImages' in parsed)
    ) {
      const od = parsed.originalDescription;
      return typeof od === 'string' ? od.trim() : '';
    }
  } catch {
    /* plain text that happened to start with "{" */
  }
  return s;
}

type HeroSlide = { kind: 'cover' | 'image' | 'video'; url: string | null };

function buildHeroSlides(v: VendorResult): HeroSlide[] {
  const dedupeKeys = new Set<string>();
  if (v.cover_photo_url) dedupeKeys.add(mediaKey(v.cover_photo_url));
  if (v.profile_image) dedupeKeys.add(mediaKey(v.profile_image));

  let gallery = (v.business_images || []).filter((u) => u && !dedupeKeys.has(mediaKey(u)));

  const slides: HeroSlide[] = [];

  if (v.cover_photo_url) {
    slides.push({ kind: 'cover', url: v.cover_photo_url });
  } else if (v.profile_image) {
    slides.push({ kind: 'cover', url: v.profile_image });
  } else {
    const firstPhotoIdx = gallery.findIndex((u) => !isVideoUrl(u));
    if (firstPhotoIdx >= 0) {
      slides.push({ kind: 'cover', url: gallery[firstPhotoIdx] });
      gallery = gallery.filter((_, i) => i !== firstPhotoIdx);
    }
  }

  const galleryImages = gallery.filter((u) => !isVideoUrl(u));
  const galleryVideos = gallery.filter((u) => isVideoUrl(u));

  galleryImages.forEach((u) => slides.push({ kind: 'image', url: u }));
  galleryVideos.forEach((u) => slides.push({ kind: 'video', url: u }));

  const vidKeys = new Set(galleryVideos.map((u) => mediaKey(u)));
  (v.business_videos || []).forEach((u) => {
    if (u && !dedupeKeys.has(mediaKey(u)) && !vidKeys.has(mediaKey(u))) {
      slides.push({ kind: 'video', url: u });
      vidKeys.add(mediaKey(u));
    }
  });

  if (slides.length === 0) slides.push({ kind: 'cover', url: null });
  return slides;
}

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();

  const [vendor, setVendor] = useState<VendorResult | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!id) return;
    try {
      if (!options?.silent) setLoading(true);
      const promises: Promise<any>[] = [
        searchVendors({ mode: 'filter', filters: { businessIds: [id] } }),
        getBusinessPricing(id),
        listBusinessReviews(id),
      ];
      if (accessToken) {
        promises.push(listCustomerReviews(accessToken));
      }
      const results = await Promise.all(promises);
      const vendorRes = results[0];
      const pricingRes = results[1];
      const reviewsRes = results[2];
      const customerReviewsRes = accessToken ? results[3] : null;

      if (vendorRes.results.length > 0) {
        setVendor(vendorRes.results[0]);
      }
      setPackages(pricingRes.packages ?? []);
      setReviews(reviewsRes.reviews || []);

      if (customerReviewsRes?.success && customerReviewsRes.reviews) {
        const existingReview = customerReviewsRes.reviews.find((r: Review) => r.business_id === id);
        setUserReview(existingReview || null);
      } else {
        setUserReview(null);
      }
    } catch (error) {
      console.error('Failed to fetch vendor data:', error);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      fetchData({ silent: true });
    }, [fetchData])
  );

  const handleOpenSocial = (url: string | null | undefined) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={['#0F172A', '#312E81']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingLabel}>Loading vendor…</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.centered}>
        <LinearGradient colors={['#F8FAFC', '#EEF2FF']} style={StyleSheet.absoluteFill} />
        <View style={styles.notFoundIcon}>
          <Ionicons name="storefront-outline" size={40} color="#64748B" />
        </View>
        <Text style={styles.notFoundTitle}>Vendor not found</Text>
        <Text style={styles.notFoundSub}>This listing may have been removed.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.notFoundBtn} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.notFoundBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroSlides = buildHeroSlides(vendor);
  const currentSlide = heroSlides[currentImageIndex] ?? heroSlides[0];

  const reviewsFromOthers = reviews.filter((r) => {
    if (userReview && r.id === userReview.id) return false;
    if (user?.id && r.customer_id === user.id) return false;
    return true;
  });
  const featuredReview = reviewsFromOthers[0] ?? null;

  const { rating: displayRating, count: reviewCount } = resolveVendorReviewDisplay(
    reviews,
    userReview,
    vendor.calculated_rating,
    vendor.review_count
  );
  const filledStars = starFillCount(displayRating);

  const socialLinks: { key: string; url: string | null | undefined; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { key: 'web', url: vendor.website_url, icon: 'globe-outline', color: '#0EA5E9' },
    { key: 'ig', url: vendor.instagram_url, icon: 'logo-instagram', color: '#E4405F' },
    { key: 'fb', url: vendor.facebook_url, icon: 'logo-facebook', color: '#1877F2' },
    { key: 'yt', url: vendor.youtube_url, icon: 'logo-youtube', color: '#EF4444' },
  ].filter((s) => !!s.url);

  const primaryCategoryName =
    vendor.business_categories?.[0]?.name || vendor.event_categories?.[0]?.name || 'Vendor';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero + carousel */}
        <View style={styles.hero}>
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
            {heroSlides.map((slide, index) => (
              <View key={`${slide.kind}-${index}-${slide.url || 'empty'}`} style={styles.heroSlide}>
                {slide.kind === 'video' && slide.url ? (
                  <TouchableOpacity
                    style={styles.heroVideoSlide}
                    activeOpacity={0.9}
                    onPress={() => {
                      const u = getMediaUrl(slide.url);
                      if (u) Linking.openURL(u).catch(() => {});
                    }}
                  >
                    <LinearGradient
                      colors={['#0F172A', '#334155', '#1E293B']}
                      style={[styles.heroImage, styles.heroVideoGradient]}
                    >
                      <Ionicons name="videocam" size={44} color="rgba(255,255,255,0.35)" />
                      <View style={styles.playCircle}>
                        <Ionicons name="play" size={26} color="#fff" />
                      </View>
                      <Text style={styles.tapToPlayText}>Tap to play video</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : slide.url ? (
                  <Image
                    source={{ uri: getMediaUrl(slide.url) || '' }}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <LinearGradient colors={['#1E293B', '#312E81', '#4C1D95']} style={styles.heroPlaceholder}>
                    <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.35)" />
                  </LinearGradient>
                )}
              </View>
            ))}
          </ScrollView>

          <LinearGradient
            colors={['rgba(15,23,42,0.55)', 'transparent']}
            style={[styles.heroTopFade, { height: 100 + insets.top }]}
          />
          <LinearGradient colors={['transparent', 'rgba(15,23,42,0.92)']} style={styles.heroBottomFade} />

          <SafeAreaView style={styles.heroTopBar} edges={['top', 'left', 'right']}>
            <HeroBackButton />
            {vendor.featured && (
              <View style={styles.featuredPill}>
                <Ionicons name="sparkles" size={12} color="#FBBF24" />
                <Text style={styles.featuredPillText}>Featured</Text>
              </View>
            )}
          </SafeAreaView>

          {heroSlides.length > 1 && (
            <View style={styles.dotsRow}>
              {heroSlides.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentImageIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={[styles.photoBadge, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
            <Text style={styles.photoBadgeText}>
              {(currentSlide.kind === 'cover' ? 'Cover' : currentSlide.kind === 'video' ? 'Video' : 'Gallery')} ·{' '}
              {currentImageIndex + 1}/{heroSlides.length}
            </Text>
          </View>
        </View>

        {/* Overlap card */}
        <View style={[styles.overlapCard, { marginTop: -36 }]}>
          <View style={styles.categoryRowSingle}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{primaryCategoryName}</Text>
            </View>
            {vendor.verified && (
              <View style={styles.verifiedChip}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={styles.verifiedChipText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.vendorTitle}>{vendor.business_name}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.statValue}>{formatRating(displayRating)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statTile}>
              <Ionicons name="chatbubbles-outline" size={16} color="#6366F1" />
              <Text style={styles.statValue}>{reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statTile}>
              <Ionicons name="ribbon-outline" size={16} color="#0EA5E9" />
              <Text style={styles.statValue}>{vendor.years_experience != null ? `${vendor.years_experience}+` : '—'}</Text>
              <Text style={styles.statLabel}>Years exp.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.locationCard}
            activeOpacity={0.75}
            onPress={() => {
              const q = [vendor.address, vendor.city, vendor.state].filter(Boolean).join(', ');
              if (q) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
            }}
          >
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {vendor.address ? `${vendor.address}, ` : ''}
                {vendor.city}
                {vendor.state ? `, ${vendor.state}` : ''}
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {socialLinks.length > 0 && (
            <View style={styles.socialBlock}>
              <Text style={styles.sectionEyebrow}>Connect</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.socialScroll}>
                {socialLinks.map((s) => (
                  <TouchableOpacity key={s.key} style={styles.socialPill} onPress={() => handleOpenSocial(s.url)} activeOpacity={0.85}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                    <Text style={styles.socialPillText}>
                      {s.key === 'web' ? 'Website' : s.key === 'ig' ? 'Instagram' : s.key === 'fb' ? 'Facebook' : 'YouTube'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.aboutBlock}>
            <Text style={styles.sectionEyebrow}>About</Text>
            <Text style={styles.aboutBody}>
              {getVendorAboutText(vendor.description) || 'No description has been added for this vendor yet.'}
            </Text>
          </View>
        </View>

        {/* Packages */}
        <View style={styles.sectionMuted}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Packages</Text>
            <Text style={styles.sectionHint}>Starting prices</Text>
          </View>
          {packages.length === 0 ? (
            <View style={styles.emptyPackages}>
              <Ionicons name="pricetags-outline" size={28} color="#CBD5E1" />
              <Text style={styles.emptyPackagesText}>No packages listed yet</Text>
            </View>
          ) : (
            packages.map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <LinearGradient colors={['#4F46E5', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.packageAccent} />
                <View style={styles.packageIconWrap}>
                  <Ionicons
                    name={pkg.name.toLowerCase().includes('floral') ? 'flower-outline' : 'layers-outline'}
                    size={22}
                    color="#4F46E5"
                  />
                </View>
                <View style={styles.packageBody}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageDesc} numberOfLines={2}>
                    {pkg.description}
                  </Text>
                </View>
                <View style={styles.packagePriceCol}>
                  <Text style={styles.packagePrice}>₹{pkg.price.toLocaleString('en-IN')}</Text>
                  <Text style={styles.packagePriceSub}>from</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Reviews */}
        <View style={styles.sectionWhite}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity onPress={() => router.push(`/vendor/reviews?businessId=${id}`)} hitSlop={12}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient colors={['#F8FAFC', '#EEF2FF']} style={styles.ratingHero}>
            <Text style={styles.ratingHeroNum}>{formatRating(displayRating)}</Text>
            <View style={styles.ratingHeroStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= filledStars ? 'star' : 'star-outline'}
                  size={18}
                  color={s <= filledStars ? '#F59E0B' : '#CBD5E1'}
                />
              ))}
            </View>
            <Text style={styles.ratingHeroSub}>
              Based on {reviewCount} review{reviewCount === 1 ? '' : 's'}
            </Text>
          </LinearGradient>

          {userReview && (
            <View style={styles.userReviewCard}>
              <View style={styles.userReviewTop}>
                <Text style={styles.userReviewLabel}>Your review</Text>
                <View style={styles.userReviewStars}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.userReviewRating}>{userReview.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.reviewQuote}>{userReview.review_text || '—'}</Text>
              {userReview.media && userReview.media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewMedia}>
                  {userReview.media.map((m) => (
                    <Image
                      key={m.file_id}
                      source={{ uri: getMediaUrl(m.url) || getMediaUrl(m.file_path) || '' }}
                      style={styles.reviewThumb}
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>
              )}
              <Text style={styles.reviewDate}>{new Date(userReview.created_at).toLocaleDateString()}</Text>
            </View>
          )}

          {featuredReview && (
            <View style={styles.featuredCard}>
              <View style={styles.featuredTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {(featuredReview.customer_first_name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featuredName}>
                    {featuredReview.customer_first_name
                      ? `${featuredReview.customer_first_name} ${featuredReview.customer_last_name || ''}`.trim()
                      : 'Guest'}
                  </Text>
                  <Text style={styles.featuredDate}>{new Date(featuredReview.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.miniStars}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.miniRating}>{featuredReview.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.featuredQuote}>{featuredReview.review_text || '—'}</Text>
              {featuredReview.media && featuredReview.media.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewMedia}>
                  {featuredReview.media.map((m) => (
                    <Image key={m.file_id} source={{ uri: getMediaUrl(m.url) || getMediaUrl(m.file_path) || '' }} style={styles.reviewThumb} contentFit="cover" />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.reviewCta} onPress={() => setIsReviewModalVisible(true)} activeOpacity={0.88}>
            <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.reviewCtaInner}>
              <Ionicons name={userReview ? 'create' : 'chatbox-ellipses-outline'} size={20} color="#4338CA" />
              <Text style={styles.reviewCtaText}>{userReview ? 'Edit your review' : 'Write a review'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.bottomWrap} edges={['bottom']}>
        <View style={styles.bottomInner}>
          <TouchableOpacity style={styles.quoteBtnWrap} onPress={() => setIsQuoteModalVisible(true)} activeOpacity={0.92}>
            <LinearGradient colors={['#0F172A', '#312E81']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.quoteGradient}>
              <Text style={styles.quoteBtnText}>Get a quote</Text>
              <Ionicons name="arrow-forward-circle" size={22} color="#FBBF24" />
            </LinearGradient>
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
        onSuccess={() => fetchData({ silent: true })}
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
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingLabel: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  notFoundIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  notFoundSub: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    marginBottom: 22,
  },
  notFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  notFoundBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  hero: {
    height: HERO_HEIGHT,
    backgroundColor: '#0F172A',
  },
  heroSlide: {
    width,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroVideoSlide: {
    width: '100%',
    height: '100%',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    marginTop: 8,
  },
  tapToPlayText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  heroVideoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  heroBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  featuredPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
  photoBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  photoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  overlapCard: {
    marginHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  categoryRowSingle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
    textTransform: 'capitalize',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  vendorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    gap: 12,
  },
  locationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },
  socialBlock: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  socialScroll: {
    gap: 10,
    flexDirection: 'row',
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  aboutBlock: {
    paddingTop: 4,
  },
  aboutBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    fontWeight: '500',
  },

  sectionMuted: {
    marginTop: 14,
    marginHorizontal: 14,
    padding: 18,
    paddingBottom: 8,
  },
  sectionHead: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyPackages: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyPackagesText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  packageAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  packageIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  packageBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  packagePriceCol: {
    paddingRight: 14,
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  packagePriceSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  sectionWhite: {
    marginHorizontal: 14,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  ratingHero: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingHeroNum: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  ratingHeroStars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    marginBottom: 8,
  },
  ratingHeroSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  userReviewCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  userReviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userReviewLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userReviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  userReviewRating: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewQuote: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    fontWeight: '500',
  },
  reviewDate: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  featuredCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 17,
    fontWeight: '800',
    color: '#4338CA',
  },
  featuredName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  featuredDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  miniStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniRating: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  featuredQuote: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    fontWeight: '500',
  },
  reviewMedia: {
    marginTop: 12,
  },
  reviewThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#E2E8F0',
  },
  reviewCta: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  reviewCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 16,
  },
  reviewCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4338CA',
  },

  bottomWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  bottomInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  quoteBtnWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quoteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  quoteBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});
