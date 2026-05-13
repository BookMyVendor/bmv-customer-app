import {
  ConciergeRequest,
  ConciergeResponse,
  MatchCategoriesRequest,
  MatchCategoriesResponse,
  ResolveCategoryRequest,
  ResolveCategoryResponse,
  VendorSearchRequest,
  VendorSearchResponse,
} from '@/types/ai.types';
import { apiPost } from './apiClient';

export async function concierge(message: string): Promise<ConciergeResponse> {
  try {
    const response = await apiPost<ConciergeResponse>(
      'functions/v1/ai-concierge',
      { message }
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'AI concierge failed');
  }
}

export async function matchCategories(searchTerms: string[]): Promise<MatchCategoriesResponse> {
  try {
    const response = await apiPost<MatchCategoriesResponse>(
      'functions/v1/ai-match-categories',
      { search_terms: searchTerms }
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to match categories');
  }
}

export async function resolveCategory(
  categoryName: string,
  categoryType?: string
): Promise<ResolveCategoryResponse> {
  try {
    const response = await apiPost<ResolveCategoryResponse>(
      'functions/v1/ai-resolve-category',
      { category_name: categoryName, category_type: categoryType }
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to resolve category');
  }
}

export async function vendorSearch(request: VendorSearchRequest): Promise<VendorSearchResponse> {
  try {
    const response = await apiPost<VendorSearchResponse>(
      'functions/v1/ai-search-vendor-v2',
      request
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Vendor search failed');
  }
}
