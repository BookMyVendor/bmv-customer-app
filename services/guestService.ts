import {
  GuestDeleteRequest,
  GuestDeleteResponse,
  GuestListGetOrCreateRequest,
  GuestListGetOrCreateResponse,
  GuestAddRequest,
  GuestAddResponse,
  GuestListGuestsListRequest,
  GuestListGuestsListResponse,
  GuestUpdateRequest,
  GuestUpdateResponse,
} from '@/types/guest.types';
import { apiPost } from './apiClient';

export async function deleteGuest(
  request: GuestDeleteRequest,
  accessToken: string
): Promise<GuestDeleteResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    await apiPost<void>(
      'functions/v1/guest-delete',
      request,
      headers
    );
    return { success: true };
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to delete guest');
  }
}

export async function getOrCreateGuestList(
  request: GuestListGetOrCreateRequest,
  accessToken: string
): Promise<GuestListGetOrCreateResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<GuestListGetOrCreateResponse>(
      'functions/v1/guest-lists-get-or-create',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to get or create guest list');
  }
}

export async function addGuest(
  request: GuestAddRequest,
  accessToken: string
): Promise<GuestAddResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<GuestAddResponse>(
      'functions/v1/guest-lists-guests-add',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to add guest');
  }
}

export async function listGuests(
  request: GuestListGuestsListRequest,
  accessToken: string
): Promise<GuestListGuestsListResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<GuestListGuestsListResponse>(
      'functions/v1/guest-lists-guests-list',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to list guests');
  }
}
export async function updateGuest(
  request: GuestUpdateRequest,
  accessToken: string
): Promise<GuestUpdateResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<GuestUpdateResponse>(
      'functions/v1/guest-update',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to update guest');
  }
}
