import { apiPost } from './apiClient';

export interface VendorSearchRequest {
  mode: 'smart' | 'filter';
  smartQuery?: string;
  sortBy?: 'rating' | 'updated_at' | 'distance' | 'price';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    eventType?: string | string[];
    serviceType?: string | string[];
    location?: string | string[];
    city?: string | string[];
    lat?: number;
    lon?: number;
    maxBudget?: number;
    minRating?: number;
    vendorName?: string;
    businessIds?: string[];
    vendorIds?: string[];
    verified?: boolean;
  };
  page?: number;
  limit?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface VendorResult {
  business_id: string;
  vendor_id: string;
  business_name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  pincode: string | null;
  district: string | null;
  profile_image: string | null;
  cover_photo_url: string | null;
  business_images: string[];
  /** Optional gallery videos (same-origin URLs as images) */
  business_videos?: string[] | null;
  calculated_rating: number | null;
  review_count: number | null;
  years_experience: number | null;
  verified: boolean;
  featured: boolean;
  availability: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  business_email: string | null;
  event_categories: CategoryItem[];
  business_categories: CategoryItem[];
  distance_km: number | null;
  operating_locations?: string[] | null;
  updated_at?: string | null;
}

export interface VendorSearchResponse {
  results: VendorResult[];
  count: number;
  appliedFilters: {
    serviceType?: string | string[] | null;
    eventType?: string | string[] | null;
    city?: string | string[] | null;
    maxBudget?: number | null;
    minRating?: number | null;
    vendorName?: string | null;
    businessIds?: string[] | null;
    vendorIds?: string[] | null;
    verified?: boolean | null;
    cityFallback?: boolean | null;
  };
  message?: string;
}

export async function searchVendors(request: VendorSearchRequest): Promise<VendorSearchResponse> {
  try {
    const response = await apiPost<VendorSearchResponse>(
      'functions/v1/ai-search-vendor-v2',
      request
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to search vendors');
  }
}

export async function getAllVendors(): Promise<VendorSearchResponse> {
  return searchVendors({
    mode: 'filter',
    filters: {},
    sortBy: 'rating',
    sortOrder: 'desc',
  });
}
