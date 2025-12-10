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
  page_title?: string;
  page_description?: string;
  meta_title?: string;
  meta_description?: string;
  page_title_ar?: string;
  page_description_ar?: string;
  meta_title_ar?: string;
  meta_description_ar?: string;
  og_image?: string;
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
  page_title?: string;
  page_description?: string;
  meta_title?: string;
  meta_description?: string;
  page_title_ar?: string;
  page_description_ar?: string;
  meta_title_ar?: string;
  meta_description_ar?: string;
  og_image?: string;
}
