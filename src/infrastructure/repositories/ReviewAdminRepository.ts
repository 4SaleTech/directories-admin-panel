import { adminApiClient } from '../api/adminApiClient';
import { Review, ReviewModerationSummary, ReviewStatus } from '@/domain/entities/Review';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class ReviewAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<Review[]>> {
    const response = await adminApiClient.get<any>('/admin/reviews', { params });
    return {
      success: true,
      data: response.data || [],
      message: response.message || 'Success',
      pagination: response.pagination,
    };
  }

  async getByStatus(status: ReviewStatus, params?: any): Promise<ApiResponse<Review[]>> {
    const response = await adminApiClient.get<any>(`/admin/reviews/status/${status}`, { params });
    return {
      success: true,
      data: response.data || [],
      message: response.message || 'Success',
      pagination: response.pagination,
    };
  }

  async approve(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.put<ApiResponse<void>>(`/admin/reviews/${id}/approve`, {});
  }

  async reject(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.put<ApiResponse<void>>(`/admin/reviews/${id}/reject`, {});
  }

  async getModerationSummary(): Promise<ApiResponse<ReviewModerationSummary>> {
    const response = await adminApiClient.get<any>('/admin/reviews/summary');
    return {
      success: true,
      data: response.data || { pending: 0, approved: 0, rejected: 0, pending_count: 0 },
      message: response.message || 'Success',
    };
  }
}

export const reviewAdminRepository = new ReviewAdminRepository();
