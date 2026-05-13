import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortOption = 'relevance' | 'rating' | 'distance' | 'price';

interface SortFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedOption: SortOption;
  onSelect: (option: SortOption) => void;
}

const OPTIONS: { label: string; value: SortOption; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Relevance', value: 'relevance', icon: 'flash-outline' },
  { label: 'Top Rated', value: 'rating', icon: 'star-outline' },
  { label: 'Nearest', value: 'distance', icon: 'location-outline' },
  { label: 'Budget-friendly', value: 'price', icon: 'wallet-outline' },
];

export const SortFilterModal: React.FC<SortFilterModalProps> = ({
  visible,
  onClose,
  selectedOption,
  onSelect,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort By</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            {OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  selectedOption === option.value && styles.optionItemActive,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <View style={styles.optionContent}>
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={selectedOption === option.value ? '#003366' : '#666'} 
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedOption === option.value && styles.optionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {selectedOption === option.value && (
                  <Ionicons name="checkmark-circle" size={22} color="#003366" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  optionItemActive: {
    backgroundColor: '#E6F0FF',
    borderColor: '#003366',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  optionLabelActive: {
    color: '#003366',
    fontWeight: '700',
  },
});
