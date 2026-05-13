import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface RatingOption {
  label: string;
  value: 'any' | '4.0' | '4.5' | '4.8';
}

const RATING_OPTIONS: RatingOption[] = [
  { label: 'Any rating', value: 'any' },
  { label: '4.0+', value: '4.0' },
  { label: '4.5+', value: '4.5' },
  { label: '4.8+', value: '4.8' },
];

interface RatingFilterModalProps {
  visible: boolean;
  selected: RatingOption['value'] | null;
  onClose: () => void;
  onSelect: (value: RatingOption['value']) => void;
}

export const RatingFilterModal = ({ visible, selected, onClose, onSelect }: RatingFilterModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Minimum Rating</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {RATING_OPTIONS.map((option) => {
              const isSelected = selected === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, isSelected && styles.optionActive]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <View style={styles.optionRow}>
                    {option.value !== 'any' && (
                      <Ionicons name="star" size={16} color={isSelected ? '#F5A623' : '#F5A623'} />
                    )}
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                      {option.label}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={20} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    padding: 4,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  optionActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
