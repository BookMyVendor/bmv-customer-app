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
