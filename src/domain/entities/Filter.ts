export interface FilterOption {
  id: number;
  filter_id: number;
  slug: string;
  value: string;
  label: string;
  label_ar?: string;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FilterOptionCreateRequest {
  label: string;
  label_ar?: string;
  value: string;
  is_default?: boolean;
  display_order?: number;
}

export interface FilterOptionUpdateRequest {
  label?: string;
  label_ar?: string;
  value?: string;
  is_default?: boolean;
  display_order?: number;
}

export interface Filter {
  id: number;
  slug: string;
  label: string;
  label_ar: string;
  type: 'dropdown' | 'checkbox' | 'radio';
  display_order: number;
  options?: FilterOption[];
  created_at: string;
  updated_at: string;
}

export interface FilterCreateRequest {
  label: string;
  label_ar?: string;
  type: 'dropdown' | 'checkbox' | 'radio';
  display_order?: number;
}

export interface FilterUpdateRequest {
  label?: string;
  label_ar?: string;
  type?: 'dropdown' | 'checkbox' | 'radio';
  display_order?: number;
}
