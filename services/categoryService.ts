import { CategoryTreeResponse } from '@/types/category.types';
import { apiPost } from './apiClient';

export async function getCategoryTree(params: { category_type?: string } = {}): Promise<CategoryTreeResponse> {
  try {
    const response = await apiPost<CategoryTreeResponse>(
      'functions/v1/category-tree',
      params
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch category tree');
  }
}
