import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

function getMediaUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? url.slice(1) : url}`;
}

const getInitials = (name: string) => {
  if (!name) return 'V';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const DynamicVendorImage = ({ vendor, style }: any) => {
  const [hasError, setHasError] = React.useState(false);
  const imageUrl = getMediaUrl(vendor.cover_photo_url || vendor.profile_image);
  const initials = getInitials(vendor.business_name);

  if (!imageUrl || hasError) {
    return (
      <View style={[style, styles.initialsContainer]}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      contentFit="cover"
      transition={300}
      onError={() => setHasError(true)}
    />
  );
};

type Variant = 'vendor' | 'guests' | 'checklist' | 'budget';

const VARIANT_COLORS: Record<Variant, { bg: string; gradient?: [string, string]; watermark: any }> = {
  vendor: {
    bg: '#3B1578',
    gradient: ['#5B21B6', '#2E0F5C'],
    watermark: 'sparkles',
  },
  guests: {
    bg: '#1E3A8A',
    gradient: ['#1E40AF', '#152C6B'],
    watermark: 'people',
  },
  checklist: {
    bg: '#0F5957',
    gradient: ['#0F766E', '#0B4744'],
    watermark: 'clipboard',
  },
  budget: {
    bg: '#1F4D2A',
    gradient: ['#15803D', '#163E20'],
    watermark: 'wallet',
  },
};

interface AIToolCardProps {
  variant: Variant;
  title: string;
  description: string;
  buttonText: string;
  image: string;
  href: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

export const AIToolCard: React.FC<AIToolCardProps> = ({
  variant,
  title,
  description,
  buttonText,
  image,
  href,
  icon,
  badge,
}) => {
  const colors = VARIANT_COLORS[variant];

  return (
    <Link href={href as any} asChild>
      <TouchableOpacity activeOpacity={0.92} style={styles.card}>
        <LinearGradient
          colors={colors.gradient || [colors.bg, colors.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top row: content (left) + image (right) */}
          <View style={styles.topRow}>
            {/* LEFT - content */}
            <View style={styles.leftCol}>
              {badge ? (
                <View style={styles.matchBadge}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.matchBadgeText}>{badge}</Text>
                </View>
              ) : icon ? (
                <View style={styles.iconBadge}>
                  <Ionicons name={icon} size={18} color="#fff" />
                </View>
              ) : null}

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>

              <View style={styles.watermarkWrap}>
                <Ionicons name={colors.watermark} size={28} color="rgba(255,255,255,0.18)" />
              </View>
            </View>

            {/* RIGHT - image */}
            <View style={styles.rightCol}>
              <ImageBackground
                source={{ uri: image }}
                style={styles.image}
                imageStyle={styles.imageStyle}
              >
                <View style={styles.expandBtn}>
                  <Ionicons name="expand-outline" size={14} color="#0F172A" />
                </View>
              </ImageBackground>
            </View>
          </View>

          {/* Bottom pill button */}
          <View style={styles.buttonRow}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>{buttonText}</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#fff"
                style={styles.buttonArrow}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Link>
  );
};

/* ------- Legacy exports (kept for backwards compatibility with other screens) ------- */

export const QuickToolCard = ({ icon, value, label, actionText, href }: any) => (
  <Link href={href || '#'} asChild>
    <TouchableOpacity style={styles.quickCard}>
      <View style={styles.quickIconCircle}>
        <Ionicons name={icon} size={24} color="#003366" />
      </View>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
      <View style={styles.quickAction}>
        <Text style={styles.quickActionText}>{actionText}</Text>
        <Ionicons name="chevron-forward" size={14} color="#003366" />
      </View>
    </TouchableOpacity>
  </Link>
);

export const AIVendorMatchCard = ({ vendorCount = 0, topVendors = [] }: { vendorCount?: number; topVendors?: any[] }) => (
  <AIToolCard
    variant="vendor"
    badge="95% Match"
    title="AI Vendor Match"
    description={`Get ${vendorCount > 0 ? Math.min(vendorCount, 3) : 3} top vendor picks\nperfectly matched to your style.`}
    buttonText="Start Side-by-Side Analysis"
    image={
      topVendors[0]
        ? getMediaUrl(topVendors[0].cover_photo_url || topVendors[0].profile_image) ||
          'https://images.unsplash.com/photo-1769638913840-2ca96d90e8a9?auto=format&fit=crop&q=80&w=600'
        : 'https://images.unsplash.com/photo-1769638913840-2ca96d90e8a9?auto=format&fit=crop&q=80&w=600'
    }
    href="/ai-vendor-match"
  />
);

export const AIBudgetPlannerCard = ({
  totalBudget = 0,
}: {
  totalBudget?: number;
  allocation?: number;
  label?: string;
}) => (
  <AIToolCard
    variant="budget"
    icon="wallet"
    title="Budget Planner"
    description={
      totalBudget > 0
        ? `Total: ₹${totalBudget.toLocaleString('en-IN')}\nPlan smart, stay within budget.`
        : `Plan smart, track expenses\nand stay within budget.`
    }
    buttonText="Open Budget Planner"
    image="https://images.unsplash.com/photo-1762319021727-c73a939c4f3b?auto=format&fit=crop&q=80&w=600"
    href="/ai-budget-planner"
  />
);

export const AIToolLinkCard = ({ title, description, icon, linkText, href }: any) => (
  <View style={styles.linkCard}>
    <View style={styles.linkIconCircle}>
      <Ionicons name={icon} size={24} color="#003366" />
    </View>
    <View style={styles.linkContent}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkDescription}>{description}</Text>
      <Link href={href || '#'} asChild>
        <TouchableOpacity style={styles.linkAction}>
          <Text style={styles.linkActionText}>{linkText}</Text>
          <Ionicons name="chevron-forward" size={16} color="#003366" />
        </TouchableOpacity>
      </Link>
    </View>
  </View>
);

const CARD_RADIUS = 22;

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  cardGradient: {
    borderRadius: CARD_RADIUS,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    minHeight: 150,
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
    paddingLeft: 4,
    paddingTop: 4,
    justifyContent: 'flex-start',
  },
  rightCol: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    minHeight: 150,
  },
  imageStyle: {
    borderRadius: 14,
  },
  expandBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
    marginBottom: 14,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 23,
  },
  description: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
    fontWeight: '500',
  },
  watermarkWrap: {
    marginTop: 'auto',
    paddingTop: 12,
  },
  buttonRow: {
    marginTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonArrow: {
    position: 'absolute',
    right: 18,
  },

  /* ---------- legacy (used by other screens) ---------- */
  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003366',
  },
  initialsContainer: {
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 16,
  },
  linkIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  linkDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#003366',
  },
});

export { DynamicVendorImage };
