import { adminApiClient } from '../api/adminApiClient';
import {
  SearchKeyword,
  SearchKeywordCreateRequest,
  SearchKeywordUpdateRequest,
  KeywordCategoryAssignment,
  TrendingSearchesResponse,
} from '@/domain/entities/SearchKeyword';
import { ApiResponse } from '@/domain/entities/ApiResponse';
import { Category } from '@/domain/entities/Category';

export class SearchKeywordAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<SearchKeyword[]>> {
    const response = await adminApiClient.get<any>('/admin/keywords', { params });
    return {
      success: true,
      data: response.data?.keywords || response.data || [],
      message: response.message || 'Success',
      pagination: response.data?.pagination,
    };
  }

  async getById(id: number): Promise<ApiResponse<SearchKeyword>> {
    return await adminApiClient.get<ApiResponse<SearchKeyword>>(`/admin/keywords/${id}`);
  }

  async create(data: SearchKeywordCreateRequest): Promise<ApiResponse<SearchKeyword>> {
    return await adminApiClient.post<ApiResponse<SearchKeyword>>('/admin/keywords', data);
  }

  async update(id: number, data: SearchKeywordUpdateRequest): Promise<ApiResponse<SearchKeyword>> {
    return await adminApiClient.put<ApiResponse<SearchKeyword>>(`/admin/keywords/${id}`, data);
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/keywords/${id}`);
  }

  // Keyword-Category assignment operations
  async assignToCategory(
    keywordId: number,
    categoryId: number,
    displayOrder: number = 0
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/keywords/${keywordId}/categories/${categoryId}`,
      { display_order: displayOrder }
    );
  }

  async removeFromCategory(keywordId: number, categoryId: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(
      `/admin/keywords/${keywordId}/categories/${categoryId}`
    );
  }

  // Get keyword's assigned categories
  async getKeywordCategories(keywordId: number): Promise<ApiResponse<Category[]>> {
    const response = await adminApiClient.get<any>(`/admin/keywords/${keywordId}/categories`);
    return {
      success: true,
      data: response.data?.categories || response.data || [],
      message: response.message || 'Success',
    };
  }

  // Get trending searches (for dashboard widget)
  async getTrendingSearches(
    period: '24h' | '7d' | '30d' = '24h',
    limit: number = 10
  ): Promise<TrendingSearchesResponse> {
    const response = await adminApiClient.get<any>('/search/trending', {
      params: { period, limit },
    });
    return {
      keywords: response.data?.keywords || [],
      period,
      limit,
      total: response.data?.total || 0,
    };
  }
}

export const searchKeywordAdminRepository = new SearchKeywordAdminRepository();
