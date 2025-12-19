export interface Section {
  id: number;
  slug: string;
  title: string;
  title_ar: string;
  cta_title?: string;
  cta_title_ar?: string;
  background_color?: string;
  background_color_dark?: string;
  business_limit: number;
  is_active: boolean;
  display_order: number;
  category_id?: number;
  tag_slugs?: string[];
  filter_criteria?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface SectionCreateRequest {
  title: string;
  title_ar?: string;
  cta_title?: string;
  cta_title_ar?: string;
  background_color?: string;
  background_color_dark?: string;
  business_limit: number;
  display_order?: number;
  category_id?: number;
  tag_slugs?: string[];
  filter_criteria?: Record<string, string>;
}

export interface SectionUpdateRequest {
  title?: string;
  title_ar?: string;
  cta_title?: string;
  cta_title_ar?: string;
  background_color?: string;
  background_color_dark?: string;
  business_limit?: number;
  display_order?: number;
  category_id?: number;
  tag_slugs?: string[];
  filter_criteria?: Record<string, string>;
}
