import { adminApiClient } from '../api/adminApiClient';
import { ReviewReport, ReviewReportSummary, ReviewReportStatus } from '@/domain/entities/ReviewReport';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class ReviewReportAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<ReviewReport[]>> {
    const response = await adminApiClient.get<any>('/admin/review-reports', { params });
    return {
      success: true,
      data: response.data || [],
      message: response.message || 'Success',
      pagination: response.pagination,
    };
  }

  async getByStatus(status: ReviewReportStatus, params?: any): Promise<ApiResponse<ReviewReport[]>> {
    const response = await adminApiClient.get<any>(`/admin/review-reports/status/${status}`, { params });
    return {
      success: true,
      data: response.data || [],
      message: response.message || 'Success',
      pagination: response.pagination,
    };
  }

  async markAsReviewed(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.put<ApiResponse<void>>(`/admin/review-reports/${id}/review`, {});
  }

  async resolve(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.put<ApiResponse<void>>(`/admin/review-reports/${id}/resolve`, {});
  }

  async dismiss(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.put<ApiResponse<void>>(`/admin/review-reports/${id}/dismiss`, {});
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/review-reports/${id}`);
  }

  async getSummary(): Promise<ApiResponse<ReviewReportSummary>> {
    const response = await adminApiClient.get<any>('/admin/review-reports/summary');
    return {
      success: true,
      data: response.data || { pending: 0, reviewed: 0, resolved: 0, dismissed: 0 },
      message: response.message || 'Success',
    };
  }
}

export const reviewReportAdminRepository = new ReviewReportAdminRepository();
