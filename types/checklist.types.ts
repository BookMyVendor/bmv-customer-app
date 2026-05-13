export interface ChecklistItem {
  checklist_id: string;
  task: string;
  category: string | null;
  priority: string | null;
  due_date: string | null;
  is_completed: boolean;
}

export interface ChecklistItemInput {
  task?: string;
  category?: string;
  priority?: string;
  due_date?: string;
  is_completed?: boolean;
}

export interface Checklist {
  id: string;
  customer_id: string;
  name: string;
  items?: ChecklistItem[];
}

export interface ChecklistCreateRequest {
  name?: string;
  items?: ChecklistItemInput[];
}

export interface ChecklistCreateResponse {
  success: boolean;
  checklist: Checklist;
}

export interface ChecklistItemsPutRequest {
  checklist_id?: string;
  id?: string;
  items?: ChecklistItemInput[];
}

export interface ChecklistItemsPutResponse {
  success: boolean;
  items: ChecklistItem[];
}

export interface ChecklistListResponse {
  success: boolean;
  checklists: Checklist[];
}
