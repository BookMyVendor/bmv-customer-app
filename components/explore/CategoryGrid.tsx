import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { CategoryModal } from './CategoryModal';
import { getCategoryTree } from '@/services/categoryService';
import { CategoryTreeNode } from '@/types/category.types';

import { useRouter } from 'expo-router';
import { useLocation } from '@/context/LocationContext';

export const CategoryGrid = () => {
  const router = useRouter();
  const { city: locationCity } = useLocation();
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await getCategoryTree();
      console.log('[CATEGORY GRID] Total categories fetched:', response.categories.length);
      const level1Categories = response.categories.filter(cat => {
        const level = Number(cat.category_level);
        const isNotRental = cat.business_model !== 'rental';
        return level === 1 && isNotRental;
      });
      console.log('[CATEGORY GRID] All level 1 non-rental categories:', level1Categories.map(c => c.name));
      const desiredKeywords = ['wedding', 'birthday', 'caterer', 'venue', 'photographer', 'photography', 'decor', 'decoration'];
      const trendingCategories = level1Categories.filter(cat => {
        const name = cat.name.toLowerCase();
        return desiredKeywords.some(keyword => name.includes(keyword));
      });
      console.log('[CATEGORY GRID] Trending categories:', trendingCategories.map(c => c.name));
      setCategories(trendingCategories);
      setAllCategories(response.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: CategoryTreeNode) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: {
        query: category.name,
        categoryName: category.name,
        categoryType: category.category_type,
        businessModel: category.business_model,
        city: locationCity || '',
        fromDashboard: 'true'
      }
    });
  };

  const getIconForCategory = (category: CategoryTreeNode): keyof typeof Ionicons.glyphMap => {
    const name = category.name.toLowerCase();
    if (name.includes('birthday')) return 'gift-outline';
    if (name.includes('wedding')) return 'heart-outline';
    if (name.includes('venue') || name.includes('hall')) return 'home-outline';
    if (name.includes('photo')) return 'camera-outline';
    if (name.includes('cater') || name.includes('food')) return 'restaurant-outline';
    if (name.includes('decor') || name.includes('flower') || name.includes('mandap')) return 'color-wand-outline';
    if (name.includes('salon') || name.includes('makeup')) return 'cut-outline';
    if (name.includes('music') || name.includes('dj')) return 'musical-notes-outline';
    if (name.includes('video')) return 'videocam-outline';
    if (name.includes('cake')) return 'cafe-outline';
    return 'grid-outline';
  };

  const getColorForCategory = (category: CategoryTreeNode): string => {
    const name = category.name.toLowerCase();
    if (name.includes('wedding')) return '#FFF0F3';
    if (name.includes('birthday')) return '#F0F7FF';
    if (name.includes('cater')) return '#FFF8F0';
    if (name.includes('photo')) return '#F0FFF4';
    if (name.includes('decor') || name.includes('mandap')) return '#F5F0FF';
    if (name.includes('venue')) return '#F0F9FF';
    return '#F8F9FB';
  };

  const getCategoryDisplayName = (category: CategoryTreeNode): string => {
    const name = category.name;
    if (name === 'Decoration / Mandap') return 'Decor';
    return name;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trending Categories</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.viewAll}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#003366" />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categoryItem}>
              <TouchableOpacity 
                style={[styles.iconCard, { backgroundColor: getColorForCategory(cat) }]}
                onPress={() => handleCategoryPress(cat)}
              >
                <Ionicons name={getIconForCategory(cat)} size={28} color="#003366" />
              </TouchableOpacity>
              <Text style={styles.categoryName} numberOfLines={2} ellipsizeMode="tail">
                {getCategoryDisplayName(cat)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <CategoryModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        categories={allCategories}
        onSelectCategory={(cat) => {
          setModalVisible(false);
          handleCategoryPress(cat);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  viewAll: {
    fontSize: 13,
    color: '#003366',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
    marginRight: 14,
    maxWidth: 88,
  },
  iconCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444',
    textAlign: 'center',
    width: '100%',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

