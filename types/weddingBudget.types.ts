export interface WeddingBudgetPlan {
  id: string;
  customer_id: string;
  name: string;
  total_budget: number;
  remaining: number;
  created_at: string;
  updated_at: string;
  categories?: WeddingBudgetPlanCategory[];
}

export interface WeddingBudgetPlanCategory {
  id: string;
  plan_id: string;
  category_name: string;
  amount: number;
  is_custom: boolean;
  display_order: number;
  percentage?: number;
  created_at?: string;
}

export interface WeddingBudgetPlanCategoriesGetRequest {
  plan_id?: string;
  id?: string;
}

export interface WeddingBudgetPlanCategoriesGetResponse {
  success: boolean;
  categories: WeddingBudgetPlanCategory[];
}

export interface WeddingBudgetPlanCategoryInput {
  category_name?: string;
  amount?: number;
  is_custom?: boolean;
  display_order?: number;
  percentage?: number;
}

export interface WeddingBudgetPlansCreateRequest {
  name?: string;
  total_budget?: number;
  categories?: WeddingBudgetPlanCategoryInput[];
}

export interface WeddingBudgetPlansCreateResponse {
  success: boolean;
  plan: WeddingBudgetPlan;
}

export interface WeddingBudgetPlansListResponse {
  success: boolean;
  plans: WeddingBudgetPlan[];
}
