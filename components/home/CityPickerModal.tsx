import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation, POPULAR_CITIES, ALL_CITIES } from '@/context/LocationContext';
import { LinearGradient } from 'expo-linear-gradient';

interface CityPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({ visible, onClose }) => {
  const { city, setCity, detectLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCities, setShowAllCities] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const insets = useSafeAreaInsets();

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return ALL_CITIES.filter((c) => c.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleCitySelect = async (selectedCity: string) => {
    const cityName = selectedCity.split(' (')[0];
    await setCity(cityName);
    setSearchQuery('');
    setShowAllCities(false);
    onClose();
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      await detectLocation();
      onClose();
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSkip = async () => {
    await setCity(null);
    setSearchQuery('');
    setShowAllCities(false);
    onClose();
  };

  const displayCities = showAllCities ? ALL_CITIES : POPULAR_CITIES;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Your City</Text>
            <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for your city"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {searchQuery.trim().length > 0 && (
            <View style={styles.searchResults}>
              {filteredCities.length === 0 ? (
                <Text style={styles.noResults}>No cities found</Text>
              ) : (
                <ScrollView style={styles.resultsList}>
                  {filteredCities.map((item) => (
                    <Pressable
                      key={item}
                      style={styles.resultItem}
                      onPress={() => handleCitySelect(item)}
                    >
                      <Ionicons name="location-outline" size={18} color="#666" />
                      <Text style={styles.resultText}>{item}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {!searchQuery.trim() && (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.content}
              contentContainerStyle={styles.contentScroll}
            >
              <TouchableOpacity
                onPress={handleDetectLocation}
                disabled={isDetecting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#003366', '#004080']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detectBtnGradient}
                >
                  {isDetecting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={20} color="#fff" />
                      <Text style={styles.detectText}>Detect My Location</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {showAllCities ? 'All Cities' : 'Popular Cities'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowAllCities(!showAllCities)}>
                    <Text style={styles.viewAllText}>
                      {showAllCities ? 'Show Less' : 'View All Cities'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.citiesList}>
                  {(showAllCities ? ALL_CITIES : POPULAR_CITIES).map((item) => {
                    const cityName = item.split(' (')[0];
                    const stateName = item.includes('(') ? item.split('(')[1].replace(')', '') : '';
                    const isSelected = city === cityName;
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[styles.cityListItem, isSelected && styles.cityListItemActive]}
                        onPress={() => handleCitySelect(item)}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.cityListIcon, isSelected && styles.cityListIconActive]}>
                          <Ionicons name="location" size={20} color={isSelected ? '#fff' : '#003366'} />
                        </View>
                        <View style={styles.cityListInfo}>
                          <Text style={[styles.cityNameText, isSelected && styles.cityNameTextActive]}>
                            {cityName}
                          </Text>
                          {stateName ? <Text style={styles.stateNameText}>{stateName}</Text> : null}
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color="#D4AF37" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  content: {
    // Removed flex: 1 to prevent collapse when parent height is undefined
  },
  contentScroll: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  detectBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    marginBottom: 28,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  detectText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
  popularCitiesScroll: {
    gap: 12,
    paddingRight: 24,
  },
  popularCityChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  popularCityChipActive: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cityChipText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  cityChipTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  viewAllPopular: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E6F0FF',
    gap: 8,
    marginLeft: 4,
  },
  viewAllIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllTextInside: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
  citiesList: {
    gap: 12,
  },
  cityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 14,
  },
  cityListItemActive: {
    backgroundColor: '#fff',
    borderColor: '#003366',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cityListIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityListIconActive: {
    backgroundColor: '#003366',
  },
  cityListInfo: {
    flex: 1,
  },
  cityNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cityNameTextActive: {
    color: '#003366',
  },
  stateNameText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  cityChip: {
    display: 'none', // Removed chips format
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 12,
    marginTop: -8,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
});
