import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

export interface PincodePlace {
  place_name: string;
  district: string;
  state: string;
  postal_code: string;
  lat: number;
  lon: number;
}

export interface PincodeAddressFill {
  area: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

/** Pincode → places from addr.post_codes (replaces api.postalpincode.in). */
export async function lookupPincodePlaces(pincode: string): Promise<PincodePlace[]> {
  const clean = pincode?.trim();
  if (!clean || !/^\d{6}$/.test(clean)) return [];

  const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
  const res = await axios.get<{
    success: boolean;
    places: PincodePlace[];
    count: number;
  }>(`${base}functions/v1/post-codes-lookup`, {
    params: { pincode: clean },
    timeout: 15000,
  });

  if (!res.data?.success) return [];
  return res.data.places ?? [];
}

/** Maps post_codes row → customer profile fields (area = post office, city = district). */
export function customerAddressFromPlace(place: PincodePlace): PincodeAddressFill {
  return {
    area: place.place_name,
    city: place.district,
    state: place.state,
    latitude: place.lat,
    longitude: place.lon,
  };
}
