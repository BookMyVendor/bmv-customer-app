import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface PriceOption {
  label: string;
  value: 'any' | 'under50k' | '50k-2l' | 'above2l';
}

const PRICE_OPTIONS: PriceOption[] = [
  { label: 'Any price', value: 'any' },
  { label: 'Under ₹50,000', value: 'under50k' },
  { label: '₹50,000 - ₹2,00,000', value: '50k-2l' },
  { label: 'Above ₹2,00,000', value: 'above2l' },
];

interface PriceFilterModalProps {
  visible: boolean;
  selected: PriceOption['value'] | null;
  onClose: () => void;
  onSelect: (value: PriceOption['value']) => void;
}

export const PriceFilterModal = ({ visible, selected, onClose, onSelect }: PriceFilterModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Price Range</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {PRICE_OPTIONS.map((option) => {
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
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {option.label}
                  </Text>
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
