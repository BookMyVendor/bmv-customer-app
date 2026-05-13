import { apiPost } from './apiClient';

export interface Package {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
}

export interface PricingResponse {
  success: boolean;
  packages: Package[];
}

export async function getBusinessPricing(businessId: string): Promise<PricingResponse> {
  try {
    const response = await apiPost<PricingResponse>(
      'functions/v1/vendor-businesses-pricing-get',
      { business_id: businessId }
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch business pricing');
  }
}

export function getLowestPrice(packages: Package[]): number | null {
  if (!packages || packages.length === 0) return null;
  const prices = packages.map(p => p.price).filter(p => p != null && p > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}
