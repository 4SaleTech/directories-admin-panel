export interface Tag {
  id: number;
  name: string;
  name_ar: string;
  slug: string;
  type?: string;
  icon?: string;
  is_active?: boolean;
  usage_count?: number;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface TagCreateRequest {
  name: string;
  name_ar?: string;
  slug?: string;
  type: string;
  description?: string;
  icon?: string;
  display_order?: number;
}

export interface TagUpdateRequest {
  name?: string;
  name_ar?: string;
  slug?: string;
  type?: string;
  description?: string;
  icon?: string;
  display_order?: number;
}
