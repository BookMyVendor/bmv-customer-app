import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

export const ExploreHero = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000' }}
        style={styles.background}
        imageStyle={styles.imageStyle}
        blurRadius={3}
      >
        <View style={styles.overlay}>
          <Text style={styles.title}>
            Find the right vendor <Text style={styles.highlight}>in minutes.</Text>
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  imageStyle: {
    opacity: 0.9,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 24,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
  },
  highlight: {
    color: '#F5A623',
    fontStyle: 'italic',
  },
});
