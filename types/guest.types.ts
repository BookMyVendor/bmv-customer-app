export interface Guest {
  id: string;
  list_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: string | null;
  category: string | null;
  plus_one: boolean;
  dietary_restrictions: string | null;
  special_requirements: string | null;
}

export interface GuestList {
  id: string;
  customer_id: string;
  event_name: string;
  guests?: Guest[];
}

export interface GuestDeleteRequest {
  guest_id?: string;
  id?: string;
}

export interface GuestDeleteResponse {
  success: boolean;
}

export interface GuestListGetOrCreateRequest {
  event_name?: string;
}

export interface GuestListGetOrCreateResponse {
  success: boolean;
  guest_list: GuestList;
}

export interface GuestAddRequest {
  list_id?: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  rsvp_status?: string;
  category?: string;
  plus_one?: boolean;
  dietary_restrictions?: string;
  special_requirements?: string;
}

export interface GuestAddResponse {
  success: boolean;
  guest: Guest;
}

export interface GuestListGuestsListRequest {
  list_id?: string;
  id?: string;
}

export interface GuestListGuestsListResponse {
  success: boolean;
  guests: Guest[];
}

export interface GuestUpdateRequest extends GuestAddRequest {
  guest_id: string;
}

export interface GuestUpdateResponse {
  success: boolean;
  guest: Guest;
}
