import { AIConciergeModal } from '@/components/concierge/AIConciergeModal';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export const ChatFAB = () => {
  const [conciergeOpen, setConciergeOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setConciergeOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open AI concierge chat">
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </TouchableOpacity>
      <AIConciergeModal visible={conciergeOpen} onClose={() => setConciergeOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
});
