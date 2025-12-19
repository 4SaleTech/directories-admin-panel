export interface SearchKeyword {
  id: number;
  keyword: string;
  keyword_ar?: string;
  description?: string;
  description_ar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchKeywordCreateRequest {
  keyword: string;
  keyword_ar?: string;
  description?: string;
  description_ar?: string;
}

export interface SearchKeywordUpdateRequest {
  keyword?: string;
  keyword_ar?: string;
  description?: string;
  description_ar?: string;
  is_active?: boolean;
}

export interface KeywordCategoryAssignment {
  display_order: number;
}

export interface TrendingKeyword {
  keyword_id: number;
  keyword: string;
  keyword_ar?: string;
  search_count: number;
}

export interface TrendingSearchesResponse {
  keywords: TrendingKeyword[];
  period: '24h' | '7d' | '30d';
  limit: number;
  total: number;
}
