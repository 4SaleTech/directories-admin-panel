import { Tag } from './Tag';

export interface Business {
  id: number;
  user_id: number;
  category_id: number;
  slug: string;
  name: string;
  name_ar: string;
  about?: string;
  about_ar?: string;
  logo?: string;
  contact_numbers?: string;
  email?: string;
  website?: string;
  address?: string;
  address_ar?: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  is_verified: boolean;
  is_featured: boolean;
  featured_until?: string;
  rating?: number;
  total_reviews?: number;
  views_count: number;
  attributes?: Record<string, string>;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export interface BusinessCreateRequest {
  user_id: number;
  category_id: number;
  name: string;
  slug: string;
  name_ar?: string;
  about?: string;
  about_ar?: string;
  logo?: string;
  contact_numbers?: string;
  email?: string;
  website?: string;
  address?: string;
  address_ar?: string;
  latitude?: number;
  longitude?: number;
  attributes?: Record<string, string>;
  filter_values?: Record<string, string>; // e.g., {"price-range": "premium", "verified": "true"}
  tag_ids?: number[];
}

export interface BusinessUpdateRequest {
  category_id?: number;
  name?: string;
  name_ar?: string;
  about?: string;
  about_ar?: string;
  logo?: string;
  contact_numbers?: string;
  email?: string;
  website?: string;
  address?: string;
  address_ar?: string;
  latitude?: number;
  longitude?: number;
  attributes?: Record<string, string>;
  filter_values?: Record<string, string>; // e.g., {"price-range": "premium", "verified": "true"}
  tag_ids?: number[];
}

export interface BusinessListParams {
  page?: number;
  limit?: number;
  status?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  category_id?: number;
  search?: string;
  sort?: string;
}
