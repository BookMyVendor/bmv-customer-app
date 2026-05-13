export interface Review {
  id: string;
  business_id: string;
  vendor_id: string;
  customer_id: string;
  lead_id: string | null;
  rating: number;
  review_text: string | null;
  review_title: string | null;
  service_date: string | null;
  status: string;
  vendor_response: string | null;
  vendor_response_date: string | null;
  created_at: string;
  updated_at: string;
  business_name?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  media?: ReviewMedia[];
}

export interface ReviewMedia {
  file_id: string;
  file_path: string | null;
  storage_bucket: string | null;
  url: string;
}

export interface ReviewDeleteRequest {
  review_id?: string;
  id?: string;
}

export interface ReviewDeleteResponse {
  success: boolean;
}

export interface ReviewUpdateRequest {
  review_id?: string;
  id?: string;
  vendor_response?: string;
  vendor_response_date?: string;
}

export interface ReviewUpdateResponse {
  success: boolean;
  review: Review;
}

export interface ReviewsCheckRequest {
  business_id?: string;
  vendor_business_id?: string;
}

export interface ReviewsCheckResponse {
  success: boolean;
  canReview: boolean;
  existingReviewId: string | null;
}

export interface ReviewsCustomerListResponse {
  success: boolean;
  reviews: Review[];
}

export interface SubmitCustomerReviewRequest {
  customer_id: string;
  business_id?: string;
  vendor_id?: string;
  rating: number;
  review_text?: string;
  review_title?: string;
  service_date?: string;
  lead_id?: string;
  review_id?: string;
}

export interface SubmitCustomerReviewResponse {
  success: boolean;
  reviewId: string;
}

export interface UploadReviewImagesResponse {
  success: boolean;
  imageUrls: string[];
  failedUploads?: Array<{
    filename: string;
    error: string;
  }>;
}
