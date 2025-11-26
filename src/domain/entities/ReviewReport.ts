export type ReviewReportReason = 'spam' | 'inappropriate' | 'offensive' | 'fake' | 'other';

export type ReviewReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface ReviewReport {
  id: number;
  review_id: number;
  reporter_user_id: number;
  reason: ReviewReportReason;
  comment?: string;
  status: ReviewReportStatus;
  created_at: string;
  updated_at: string;
  // Additional fields that might come from joins
  review_rating?: number;
  review_comment?: string;
  review_user_name?: string;
  business_name?: string;
}

export interface ReviewReportSummary {
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
}
