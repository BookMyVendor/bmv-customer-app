export interface Customer {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  area: string | null;
  registration_source?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerByPhoneRequest {
  phone: string;
}

export interface CustomerByPhoneResponse {
  success: boolean;
  customer: Customer;
}

export interface CustomerCreateRequest {
  phone: string;
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CustomerCreateResponse {
  success: boolean;
  customer: Customer;
  created: boolean;
}

export interface CustomerMeGetResponse {
  success: boolean;
  customer: Customer;
}

export interface CustomerMeUpdateRequest {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  area?: string;
  registration_source?: string;
  pincode?: string;
}

export interface CustomerMeUpdateResponse {
  success: boolean;
  customer: Customer;
}
