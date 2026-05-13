import {
  WeddingBudgetPlanCategoriesGetRequest,
  WeddingBudgetPlanCategoriesGetResponse,
  WeddingBudgetPlansCreateRequest,
  WeddingBudgetPlansCreateResponse,
  WeddingBudgetPlansListResponse,
} from '@/types/weddingBudget.types';
import { apiPost } from './apiClient';

export async function getWeddingBudgetPlanCategories(
  request: WeddingBudgetPlanCategoriesGetRequest,
  accessToken: string
): Promise<WeddingBudgetPlanCategoriesGetResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<WeddingBudgetPlanCategoriesGetResponse>(
      'functions/v1/wedding-budget-plan-categories-get',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch budget plan categories');
  }
}

export async function createWeddingBudgetPlan(
  request: WeddingBudgetPlansCreateRequest,
  accessToken: string
): Promise<WeddingBudgetPlansCreateResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<WeddingBudgetPlansCreateResponse>(
      'functions/v1/wedding-budget-plans-create',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to create wedding budget plan');
  }
}

export async function listWeddingBudgetPlans(
  accessToken: string
): Promise<WeddingBudgetPlansListResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<WeddingBudgetPlansListResponse>(
      'functions/v1/wedding-budget-plans-list',
      {},
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch wedding budget plans');
  }
}
