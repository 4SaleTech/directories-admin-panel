export interface Badge {
  id: number;
  slug: string;
  name: string;
  name_ar: string;
  image_url_en: string;
  image_url_ar: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBadgeRequest {
  name: string;
  name_ar: string;
  image_url_en: string;
  image_url_ar: string;
  display_order?: number;
}

export interface UpdateBadgeRequest {
  name?: string;
  name_ar?: string;
  image_url_en?: string;
  image_url_ar?: string;
  display_order?: number;
}

export interface BadgeAssignmentRequest {
  badge_ids: number[];
}
