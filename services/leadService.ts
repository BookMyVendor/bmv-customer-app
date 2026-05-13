import {
  SubmitCustomerLeadRequest,
  SubmitCustomerLeadResponse,
} from '@/types/lead.types';
import { apiPost } from './apiClient';

export async function submitCustomerLead(
  request: SubmitCustomerLeadRequest,
  accessToken?: string
): Promise<SubmitCustomerLeadResponse> {
  try {
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await apiPost<SubmitCustomerLeadResponse>(
      'functions/v1/submit-customer-lead',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to submit lead');
  }
}
