import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryTreeNode } from '@/types/category.types';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryTreeNode[];
  onSelectCategory: (category: CategoryTreeNode) => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const SHEET_H_PAD = 20;
const GRID_GAP = 12;
const NUM_COLS = 2;
const CARD_W = Math.floor((SCREEN_W - SHEET_H_PAD * 2 - GRID_GAP * (NUM_COLS - 1)) / NUM_COLS);

type TabKey = 'event' | 'service' | 'rental';

type CategoryTheme = {
  icon: keyof typeof Ionicons.glyphMap;
  primary: string;
  surface: string;
};

const TAB_META: { key: TabKey; short: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'event', short: 'Events', icon: 'calendar-outline' },
  { key: 'service', short: 'Services', icon: 'briefcase-outline' },
  { key: 'rental', short: 'Rentals', icon: 'cube-outline' },
];

const FALLBACK_THEMES: CategoryTheme[] = [
  { icon: 'prism-outline', primary: '#7C3AED', surface: '#F5F3FF' },
  { icon: 'layers-outline', primary: '#0EA5E9', surface: '#F0F9FF' },
  { icon: 'diamond-outline', primary: '#DB2777', surface: '#FDF2F8' },
  { icon: 'planet-outline', primary: '#EA580C', surface: '#FFF7ED' },
  { icon: 'leaf-outline', primary: '#059669', surface: '#ECFDF5' },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

/** Icon + accent colors — tuned for variety without looking random */
function getCategoryTheme(category: CategoryTreeNode): CategoryTheme {
  const name = category.name.toLowerCase();
  if (name.includes('festival') || name.includes('diwali') || name.includes('cultural') || name.includes('puja'))
    return { icon: 'sparkles-outline', primary: '#CA8A04', surface: '#FEFCE8' };
  if (name.includes('exhibition') || name.includes('trade') || name.includes('fair') || name.includes('show'))
    return { icon: 'images-outline', primary: '#7C3AED', surface: '#F5F3FF' };
  if (name.includes('wedding')) return { icon: 'heart-outline', primary: '#DB2777', surface: '#FDF2F8' };
  if (name.includes('birthday')) return { icon: 'gift-outline', primary: '#EA580C', surface: '#FFF7ED' };
  if (name.includes('venue') || name.includes('hall') || name.includes('banquet'))
    return { icon: 'business-outline', primary: '#0369A1', surface: '#F0F9FF' };
  if (name.includes('photo')) return { icon: 'camera-outline', primary: '#4F46E5', surface: '#EEF2FF' };
  if (name.includes('cater') || name.includes('food')) return { icon: 'restaurant-outline', primary: '#B45309', surface: '#FFFBEB' };
  if (name.includes('decor') || name.includes('flower') || name.includes('mandap'))
    return { icon: 'color-palette-outline', primary: '#A21CAF', surface: '#FAF5FF' };
  if (name.includes('salon') || name.includes('makeup')) return { icon: 'cut-outline', primary: '#BE185D', surface: '#FDF2F8' };
  if (name.includes('music') || name.includes('dj')) return { icon: 'musical-notes-outline', primary: '#0D9488', surface: '#F0FDFA' };
  if (name.includes('video')) return { icon: 'videocam-outline', primary: '#7C3AED', surface: '#F5F3FF' };
  if (name.includes('cake')) return { icon: 'cafe-outline', primary: '#C2410C', surface: '#FFF7ED' };
  if (name.includes('rent') || name.includes('car') || name.includes('furniture'))
    return { icon: 'cube-outline', primary: '#0F766E', surface: '#F0FDFA' };
  return FALLBACK_THEMES[hashString(category.id) % FALLBACK_THEMES.length];
}

function getCategoryDisplayName(category: CategoryTreeNode): string {
  const n = category.name;
  if (n === 'Decoration / Mandap') return 'Decor';
  return n;
}

export const CategoryModal = ({ visible, onClose, categories, onSelectCategory }: CategoryModalProps) => {
  const insets = useSafeAreaInsets();
  const [stack, setStack] = useState<CategoryTreeNode[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('event');

  const eventRoots = useMemo(
    () => categories.filter((c) => c.category_type === 'event'),
    [categories]
  );
  const businessRoots = useMemo(
    () => categories.filter((c) => c.category_type === 'business'),
    [categories]
  );
  const rentalRoots = useMemo(
    () => categories.filter((c) => c.category_type === 'business' && c.business_model === 'rental'),
    [categories]
  );
  const serviceRoots = useMemo(
    () => businessRoots.filter((c) => c.business_model !== 'rental'),
    [businessRoots]
  );

  const firstAvailableTab = useMemo<TabKey | null>(() => {
    if (eventRoots.length) return 'event';
    if (serviceRoots.length) return 'service';
    if (rentalRoots.length) return 'rental';
    return null;
  }, [eventRoots.length, serviceRoots.length, rentalRoots.length]);

  useEffect(() => {
    if (!visible) {
      setStack([]);
      return;
    }
    if (firstAvailableTab) setActiveTab(firstAvailableTab);
  }, [visible, firstAvailableTab]);

  const currentRoots = useMemo(() => {
    if (activeTab === 'event') return eventRoots;
    if (activeTab === 'rental') return rentalRoots;
    return serviceRoots;
  }, [activeTab, eventRoots, rentalRoots, serviceRoots]);

  const gridData: CategoryTreeNode[] = useMemo(() => {
    if (stack.length === 0) return currentRoots;
    const parent = stack[stack.length - 1];
    return parent.children ?? [];
  }, [stack, currentRoots]);

  const currentParent = stack.length > 0 ? stack[stack.length - 1] : null;

  const applyFilter = (cat: CategoryTreeNode) => {
    onSelectCategory(cat);
  };

  const drillInto = (cat: CategoryTreeNode) => {
    const kids = cat.children?.length ? cat.children : [];
    if (kids.length === 0) return;
    setStack((s) => [...s, cat]);
  };

  const selectParentScope = () => {
    if (currentParent) onSelectCategory(currentParent);
  };

  const renderCard = ({ item }: { item: CategoryTreeNode }) => {
    const childCount = item.children?.length ?? 0;
    const hasKids = childCount > 0;
    const theme = getCategoryTheme(item);

    return (
      <View style={[styles.card, { width: CARD_W }]}>
        <Pressable
          style={({ pressed }) => [styles.cardMain, pressed && styles.cardMainPressed]}
          onPress={() => applyFilter(item)}
          android_ripple={{ color: 'rgba(15,23,42,0.05)' }}
        >
          <View style={[styles.leadIcon, { backgroundColor: theme.surface }]}>
            <Ionicons name={theme.icon} size={22} color={theme.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {getCategoryDisplayName(item)}
            </Text>
            {hasKids ? (
              <Text style={styles.cardSub}>{childCount} inside</Text>
            ) : (
              <Text style={styles.cardSubMuted}>Search</Text>
            )}
          </View>
        </Pressable>

        {hasKids ? (
          <TouchableOpacity
            style={[styles.drillBtn, { backgroundColor: theme.surface }]}
            onPress={() => drillInto(item)}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityLabel={`Open ${childCount} subcategories`}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const listKey = `${activeTab}-${stack.map((s) => s.id).join('-')}`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Categories</Text>
              <Text style={styles.sheetSubtitle}>
                Tap the card to search. Tap the <Text style={styles.sheetSubtitleEm}>arrow</Text> on the right to open
                subcategories.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          {stack.length > 0 ? (
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity
                style={styles.backChip}
                onPress={() => setStack((s) => s.slice(0, -1))}
                hitSlop={8}
                accessibilityLabel="Go back one level"
              >
                <Ionicons name="chevron-back" size={18} color="#4F46E5" />
                <Text style={styles.backChipText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
                {getCategoryDisplayName(currentParent!)}
              </Text>
              <TouchableOpacity onPress={selectParentScope} hitSlop={8}>
                <Text style={styles.searchAllLink}>Search all</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tabRow}>
              {TAB_META.filter((t) => {
                if (t.key === 'event') return eventRoots.length > 0;
                if (t.key === 'service') return serviceRoots.length > 0;
                return rentalRoots.length > 0;
              }).map((t) => {
                const active = activeTab === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tabPill, active && styles.tabPillActive]}
                    onPress={() => setActiveTab(t.key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={t.icon}
                      size={14}
                      color={active ? '#fff' : '#64748B'}
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{t.short}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <FlatList
            key={listKey}
            data={gridData}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLS}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.gridContent}
            scrollEnabled={gridData.length > 8}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="folder-open-outline" size={28} color="#94A3B8" />
                </View>
                <Text style={styles.emptyText}>No categories here</Text>
                <Text style={styles.emptyHint}>Try another tab above</Text>
              </View>
            }
            renderItem={renderCard}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: SHEET_H_PAD,
    paddingTop: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E8E8ED',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 28,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  sheetHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.35,
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 17,
  },
  sheetSubtitleEm: {
    fontWeight: '700',
    color: '#374151',
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tabIcon: {
    marginRight: 5,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabPillTextActive: {
    color: '#fff',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 2,
  },
  backChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  breadcrumbCurrent: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  searchAllLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.2,
  },
  gridContent: {
    paddingBottom: 22,
    paddingTop: 4,
  },
  columnWrap: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
    gap: GRID_GAP,
  },
  /** Reference: horizontal row card, white, soft shadow, large radius */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 72,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  cardMainPressed: {
    opacity: 0.92,
  },
  leadIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardSubMuted: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  drillBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  emptyHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
