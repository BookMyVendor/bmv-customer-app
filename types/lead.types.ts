export interface SubmitCustomerLeadRequest {
  business_id?: string;
  vendor_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  category_id?: string;
  template_id?: string;
  sub_template_id?: string;
  lead_type?: 'inquiry' | 'quote_request' | 'booking_interest';
  event_date?: string;
  event_location?: string;
  guest_count?: number;
  event_duration_hours?: number;
  budget_range?: string;
  requirements?: string;
  notes?: string;
  event_type?: string;
  search_context?: Record<string, unknown>;
}

export interface SubmitCustomerLeadResponse {
  success: boolean;
  leadId: string;
}

export type LeadType = 'inquiry' | 'quote_request' | 'booking_interest';

export interface CustomerLeadSummary {
  id: string;
  business_id: string | null;
  vendor_id: string | null;
  category_id: string | null;
  template_id: string | null;
  sub_template_id: string | null;
  lead_type: LeadType | string;
  event_date: string | null;
  event_location: string | null;
  guest_count: number | null;
  event_duration_hours: number | null;
  budget_range: string | null;
  requirements: string | null;
  lead_status: string | null;
  lead_source: string | null;
  status: string | null;
  source: string | null;
  notes: string | null;
  event_type: string | null;
  created_at: string;
  updated_at: string;
  business_name: string | null;
  business_slug: string | null;
}

export interface CustomerLeadDetail extends CustomerLeadSummary {
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  search_context: Record<string, unknown> | null;
  business_city: string | null;
}

export interface LeadCommunication {
  id: string;
  lead_id: string;
  vendor_id: string | null;
  message: string;
  communication_type: string | null;
  is_from_vendor: boolean;
  created_at: string;
}

export interface ListCustomerLeadsRequest {
  lead_type?: LeadType;
  status?: string;
  lead_status?: string;
  limit?: number;
  offset?: number;
}

export interface ListCustomerLeadsResponse {
  success: boolean;
  leads: CustomerLeadSummary[];
}

export interface GetCustomerLeadRequest {
  lead_id: string;
}

export interface GetCustomerLeadResponse {
  success: boolean;
  lead: CustomerLeadDetail;
  communications: LeadCommunication[];
}
