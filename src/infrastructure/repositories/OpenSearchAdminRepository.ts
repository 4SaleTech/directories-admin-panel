import { adminApiClient } from '../api/adminApiClient';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export interface OpenSearchStatus {
  status: string;
  connected: boolean;
  current_backend: 'elasticsearch' | 'database';
  reindex_running: boolean;
  tag_repo_configured: boolean;
}

export interface UnsyncedCounts {
  unsynced_businesses: number;
  unsynced_reviews: number;
}

export interface ReindexResult {
  message: string;
  synced: number;
  failed: number;
}

export interface MarkUnsyncedResult {
  message: string;
  businesses_marked: number;
}

export interface BackendSwitchResult {
  message: string;
  current_backend: string;
}

export class OpenSearchAdminRepository {
  async getStatus(): Promise<ApiResponse<OpenSearchStatus>> {
    const response = await adminApiClient.get<any>('/admin/opensearch/status');
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }

  async getUnsyncedCounts(): Promise<ApiResponse<UnsyncedCounts>> {
    const response = await adminApiClient.get<any>('/admin/opensearch/unsynced');
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }

  async markAllBusinessesUnsynced(): Promise<ApiResponse<MarkUnsyncedResult>> {
    const response = await adminApiClient.post<any>('/admin/opensearch/mark-all-unsynced');
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }

  async reindexBusinesses(batchSize?: number): Promise<ApiResponse<ReindexResult>> {
    const params = batchSize ? { batch_size: batchSize } : {};
    const response = await adminApiClient.post<any>('/admin/opensearch/reindex/businesses', null, { params });
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }

  async reindexReviews(batchSize?: number): Promise<ApiResponse<ReindexResult>> {
    const params = batchSize ? { batch_size: batchSize } : {};
    const response = await adminApiClient.post<any>('/admin/opensearch/reindex/reviews', null, { params });
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }

  async reindexAll(batchSize?: number): Promise<ApiResponse<{ message: string }>> {
    const params = batchSize ? { batch_size: batchSize } : {};
    const response = await adminApiClient.post<any>('/admin/opensearch/reindex', null, { params });
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }

  async recreateIndex(): Promise<ApiResponse<{ message: string }>> {
    const response = await adminApiClient.post<any>('/admin/opensearch/recreate-index');
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }

  async switchBackend(backend: 'elasticsearch' | 'database'): Promise<ApiResponse<BackendSwitchResult>> {
    const response = await adminApiClient.post<any>('/admin/opensearch/backend', null, {
      params: { backend },
    });
    return {
      success: true,
      data: response.data || response,
      message: response.message || 'Success',
    };
  }
}

export const openSearchAdminRepository = new OpenSearchAdminRepository();
