import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const AIPlannerCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.title}>Unsure where to start?</Text>
        </View>
        <Text style={styles.subtitle}>
          Our AI Planner curates your dream wedding based on budget & style.
        </Text>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Try AI Planner</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.decorator}>
        <Ionicons name="sparkles" size={40} color="rgba(255,255,255,0.15)" />
        <Ionicons name="star" size={20} color="rgba(255,255,255,0.1)" style={styles.smallStar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#004A7C',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    zIndex: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: '75%',
  },
  button: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#003366',
    fontWeight: '700',
    fontSize: 14,
  },
  decorator: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  smallStar: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
});
