export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: number;
  business_id: number;
  user_id: number;
  rating: number; // 1-5 stars
  comment?: string;
  user_name: string;
  user_avatar?: string;
  is_verified: boolean;
  status: ReviewStatus;
  images?: ReviewImage[];
  created_at: string;
  updated_at: string;
  // Additional fields for display
  business_name?: string;
  business_slug?: string;
}

export interface ReviewImage {
  id: number;
  review_id: number;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    [key: number]: number;
  };
}

export interface ReviewModerationSummary {
  pending: number;
  approved: number;
  rejected: number;
  pending_count: number;
}
