import {
  ReviewDeleteRequest,
  ReviewDeleteResponse,
  ReviewUpdateRequest,
  ReviewUpdateResponse,
  ReviewsCheckRequest,
  ReviewsCheckResponse,
  ReviewsCustomerListResponse,
  SubmitCustomerReviewRequest,
  SubmitCustomerReviewResponse,
} from '@/types/review.types';
import { apiPost } from './apiClient';

export async function deleteReview(
  request: ReviewDeleteRequest,
  accessToken: string
): Promise<ReviewDeleteResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    await apiPost<void>(
      'functions/v1/review-delete',
      request,
      headers
    );
    return { success: true };
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to delete review');
  }
}

export async function updateReview(
  request: ReviewUpdateRequest,
  accessToken: string
): Promise<ReviewUpdateResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<ReviewUpdateResponse>(
      'functions/v1/review-update',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to update review');
  }
}

export async function checkCanReview(
  request: ReviewsCheckRequest,
  accessToken: string
): Promise<ReviewsCheckResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<ReviewsCheckResponse>(
      'functions/v1/reviews-check',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to check review eligibility');
  }
}

export async function listCustomerReviews(
  accessToken: string
): Promise<ReviewsCustomerListResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<ReviewsCustomerListResponse>(
      'functions/v1/reviews-customer-list',
      {},
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch reviews');
  }
}

export async function submitCustomerReview(
  request: SubmitCustomerReviewRequest,
  accessToken: string
): Promise<SubmitCustomerReviewResponse> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await apiPost<SubmitCustomerReviewResponse>(
      'functions/v1/submit-customer-review',
      request,
      headers
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to submit review');
  }
}

export async function uploadReviewImages(
  reviewId: string,
  images: File[],
  accessToken: string
): Promise<any> {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };

    const formData = new FormData();
    formData.append('reviewId', reviewId);
    images.forEach((image) => {
      formData.append('images', image);
    });

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';
    const url = `${API_URL}functions/v1/upload-review-images`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload images');
    }

    return await response.json();
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to upload review images');
  }
}
export async function listBusinessReviews(
  businessId: string
): Promise<ReviewsCustomerListResponse> {
  try {
    const response = await apiPost<ReviewsCustomerListResponse>(
      'functions/v1/reviews-list',
      { business_id: businessId }
    );
    return response;
  } catch (error) {
    const apiError = error as any;
    throw new Error(apiError.error || 'Failed to fetch business reviews');
  }
}
