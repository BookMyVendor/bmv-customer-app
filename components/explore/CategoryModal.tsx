import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryTreeNode } from '@/types/category.types';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryTreeNode[];
  onSelectCategory: (category: CategoryTreeNode) => void;
}

export const CategoryModal = ({ visible, onClose, categories }: CategoryModalProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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

  const getCategoryDisplayName = (category: CategoryTreeNode): string => {
    const name = category.name;
    if (name === 'Decoration / Mandap') return 'Decor';
    return name;
  };

  const renderCategoryItem = (category: CategoryTreeNode, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <View key={category.id} style={[styles.categoryItem, { marginLeft: level * 16 }]}>
        <TouchableOpacity 
          style={styles.categoryRow}
          onPress={() => onSelectCategory(category)}
        >
          <View style={styles.categoryInfo}>
            {hasChildren && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
                style={styles.expandIcon}
              >
                <Ionicons 
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            )}
            <View style={styles.iconContainer}>
              <Ionicons name={getIconForCategory(category)} size={20} color="#003366" />
            </View>
            <Text style={styles.categoryName}>{getCategoryDisplayName(category)}</Text>
          </View>
        </TouchableOpacity>
        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {category.children?.map((child) => renderCategoryItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const eventCategories = categories.filter(cat => cat.category_type === 'event');
  const businessCategories = categories.filter(cat => cat.category_type === 'business');
  const rentalCategories = categories.filter(cat => cat.category_type === 'business' && cat.business_model === 'rental');
  const serviceCategories = businessCategories.filter(cat => cat.business_model !== 'rental');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Categories</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
            {eventCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Events</Text>
                <View style={styles.sectionContent}>
                  {eventCategories.map((cat) => renderCategoryItem(cat))}
                </View>
              </View>
            )}

            {serviceCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business / Services</Text>
                <View style={styles.sectionContent}>
                  {serviceCategories.map((cat) => renderCategoryItem(cat))}
                </View>
              </View>
            )}

            {rentalCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rental</Text>
                <View style={styles.sectionContent}>
                  {rentalCategories.map((cat) => renderCategoryItem(cat))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    padding: 12,
  },
  categoryItem: {
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  childrenContainer: {
    marginTop: 4,
  },
  expandIcon: {
    padding: 8,
    marginRight: 4,
  },
});
