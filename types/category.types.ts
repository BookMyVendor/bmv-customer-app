export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parent_category_id: string | null;
  sort_order: number | null;
  visible: boolean;
  category_type: 'service' | 'event' | 'business';
  vendor_count: number | null;
  category_level: number | null;
  icon: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  business_model: string | null;
  image_url: string | null;
  children: CategoryTreeNode[];
}

export interface CategoryTreeResponse {
  success: boolean;
  categories: CategoryTreeNode[];
}
