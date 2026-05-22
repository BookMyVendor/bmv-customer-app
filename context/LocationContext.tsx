import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LocationState, LocationContextType } from '@/types/location.types';

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const CITY_KEY = '@bmv_selected_city';

const POPULAR_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Goa',
  'Ahmedabad', 'Pune', 'Chennai', 'Kolkata', 'Kochi',
];

const ALL_CITIES = [
  'Mumbai (Maharashtra)',
  'Delhi (Delhi)',
  'Bangalore (Karnataka)',
  'Hyderabad (Telangana)',
  'Chennai (Tamil Nadu)',
  'Kolkata (West Bengal)',
  'Pune (Maharashtra)',
  'Ahmedabad (Gujarat)',
  'Jaipur (Rajasthan)',
  'Surat (Gujarat)',
  'Lucknow (Uttar Pradesh)',
  'Kanpur (Uttar Pradesh)',
  'Nagpur (Maharashtra)',
  'Indore (Madhya Pradesh)',
  'Bhopal (Madhya Pradesh)',
  'Visakhapatnam (Andhra Pradesh)',
  'Patna (Bihar)',
  'Vadodara (Gujarat)',
  'Ghaziabad (Uttar Pradesh)',
  'Ludhiana (Punjab)',
  'Agra (Uttar Pradesh)',
  'Nashik (Maharashtra)',
  'Faridabad (Haryana)',
  'Meerut (Uttar Pradesh)',
  'Rajkot (Gujarat)',
  'Varanasi (Uttar Pradesh)',
  'Goa (Goa)',
  'Udaipur (Rajasthan)',
];

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>({
    city: null,
    isLoading: true,
  });

  useEffect(() => {
    loadCity();
  }, []);

  const loadCity = async () => {
    try {
      const city = await AsyncStorage.getItem(CITY_KEY);
      if (city) {
        setState({
          city,
          isLoading: false,
        });
      } else {
        await detectLocation();
      }
    } catch {
      await detectLocation();
    }
  };

  const setCity = async (city: string | null) => {
    try {
      if (city === null) {
        await AsyncStorage.removeItem(CITY_KEY);
      } else {
        await AsyncStorage.setItem(CITY_KEY, city);
      }
      setState((prev) => ({ ...prev, city }));
    } catch {
      // ignore
    }
  };

  const detectLocation = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const nearestCity = findNearestCity(
        location.coords.latitude,
        location.coords.longitude
      );
      await setCity(nearestCity);
    } catch {
      // location unavailable — user can pick a city manually
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const findNearestCity = (lat: number, lng: number): string => {
    let nearest = 'Mumbai';
    let minDist = Infinity;

    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
      const dist = Math.sqrt(
        Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }

    return nearest;
  };

  const contextValue: LocationContextType = {
    ...state,
    setCity,
    detectLocation,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export { POPULAR_CITIES, ALL_CITIES };
