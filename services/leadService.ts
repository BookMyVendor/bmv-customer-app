import {
  GetCustomerLeadRequest,
  GetCustomerLeadResponse,
  ListCustomerLeadsRequest,
  ListCustomerLeadsResponse,
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

export async function listCustomerLeads(
  request: ListCustomerLeadsRequest,
  accessToken: string
): Promise<ListCustomerLeadsResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<ListCustomerLeadsResponse>(
      'functions/v1/leads-customer-list',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch quotes');
  }
}

export async function getCustomerLead(
  request: GetCustomerLeadRequest,
  accessToken: string
): Promise<GetCustomerLeadResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<GetCustomerLeadResponse>(
      'functions/v1/leads-customer-get',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch quote details');
  }
}
