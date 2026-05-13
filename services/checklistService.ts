import {
  ChecklistCreateRequest,
  ChecklistCreateResponse,
  ChecklistItemsPutRequest,
  ChecklistItemsPutResponse,
  ChecklistListResponse,
} from '@/types/checklist.types';
import { apiPost } from './apiClient';

export async function createChecklist(
  request: ChecklistCreateRequest,
  accessToken: string
): Promise<ChecklistCreateResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<ChecklistCreateResponse>(
      'functions/v1/checklists-create',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to create checklist');
  }
}

export async function updateChecklistItems(
  request: ChecklistItemsPutRequest,
  accessToken: string
): Promise<ChecklistItemsPutResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<ChecklistItemsPutResponse>(
      'functions/v1/checklists-items-put',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to update checklist items');
  }
}

export async function listChecklists(
  accessToken: string
): Promise<ChecklistListResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<ChecklistListResponse>(
      'functions/v1/checklists-list',
      {},
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch checklists');
  }
}
