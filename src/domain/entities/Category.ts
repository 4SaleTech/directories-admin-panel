export interface Category {
  id: number;
  slug: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  icon?: string;
  icon_url?: string; // Keep for backward compatibility
  is_active: boolean;
  display_order: number;
  businesses_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreateRequest {
  name: string;
  slug?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  icon?: string;
  display_order?: number;
}

export interface CategoryUpdateRequest {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  icon?: string;
  display_order?: number;
}
