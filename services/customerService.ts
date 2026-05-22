import {
  CustomerByPhoneRequest,
  CustomerByPhoneResponse,
  CustomerCreateRequest,
  CustomerCreateResponse,
  CustomerMeGetResponse,
  CustomerMeUpdateRequest,
  CustomerMeUpdateResponse,
} from '@/types/customer.types';
import { assertCustomerIsActive } from '@/utils/customerActive';
import { apiPost } from './apiClient';

/** Returns customer profile by phone; throws if account exists but is deactivated. */
export async function getActiveCustomerByPhone(phone: string): Promise<CustomerByPhoneResponse> {
  const response = await getCustomerByPhone(phone);
  assertCustomerIsActive(response.customer);
  return response;
}

export async function getCustomerByPhone(
  phone: string
): Promise<CustomerByPhoneResponse> {
  try {
    const response = await apiPost<CustomerByPhoneResponse>(
      'functions/v1/customers-by-phone',
      { phone }
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch customer');
  }
}

export async function createCustomer(
  request: CustomerCreateRequest
): Promise<CustomerCreateResponse> {
  try {
    const response = await apiPost<CustomerCreateResponse>(
      'functions/v1/customers-create',
      request
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to create customer');
  }
}

export async function getMe(
  accessToken: string
): Promise<CustomerMeGetResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<CustomerMeGetResponse>(
      'functions/v1/customers-me-get',
      {},
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch customer');
  }
}

export async function updateMe(
  request: CustomerMeUpdateRequest,
  accessToken: string
): Promise<CustomerMeUpdateResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<CustomerMeUpdateResponse>(
      'functions/v1/customers-me-update',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to update customer');
  }
}
