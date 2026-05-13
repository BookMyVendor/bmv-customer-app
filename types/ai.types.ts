export type Intent = "TOOL" | "SEARCH" | "GUIDANCE";
export type Action = "OPEN_TOOL" | "CALL_SEARCH" | "ASK_CLARIFY";
export type Tool = "CHECKLIST" | "BUDGET" | "GUESTS" | "SEATING" | null;

export interface ConciergeRequest {
  message: string;
}

export interface ConciergeResponse {
  intent: Intent;
  action: Action;
  tool: Tool;
  message: string;
  searchFilters?: SearchParams | null;
}

export interface MatchCategoriesRequest {
  search_terms: string[];
}

export interface MatchCategoriesResponse {
  success: boolean;
  result: any[];
}

export interface ResolveCategoryRequest {
  category_name: string;
  category_type?: string;
}

export interface ResolveCategoryResponse {
  success: boolean;
  result: any;
}

export interface SearchParams {
  serviceType?: string | string[] | null;
  eventType?: string | string[] | null;
  city?: string | string[] | null;
  maxBudget?: number | null;
  minRating?: number | null;
  vendorName?: string | null;
  isValidSearchQuery?: boolean;
}

export type SearchMode = "smart" | "filter";

export interface VendorSearchFilters {
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
}

export interface VendorSearchRequest {
  mode: SearchMode;
  smartQuery?: string;
  sortBy?: "rating" | "updated_at";
  sortOrder?: "asc" | "desc";
  filters?: VendorSearchFilters;
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
  calculated_rating: number | null;
  review_count: number | null;
  years_experience: number | null;
  verified: boolean;
  featured: boolean;
  availability: string | null;
  website_url: string | null;
  instagram_url: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  business_email: string | null;
  event_categories: CategoryItem[];
  business_categories: CategoryItem[];
  distance_km: number | null;
  operating_locations?: string[] | null;
  updated_at?: string | null;
}

export interface AppliedFilters {
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
}

export interface VendorSearchResponse {
  results: VendorResult[];
  count: number;
  appliedFilters: AppliedFilters;
  message?: string;
}
