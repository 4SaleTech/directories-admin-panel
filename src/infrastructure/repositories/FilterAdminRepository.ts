import { adminApiClient } from '../api/adminApiClient';
import {
  Filter,
  FilterOption,
  FilterCreateRequest,
  FilterUpdateRequest,
  FilterOptionCreateRequest,
  FilterOptionUpdateRequest,
} from '@/domain/entities/Filter';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class FilterAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<Filter[]>> {
    const response = await adminApiClient.get<any>('/admin/filters', { params });
    return {
      success: true,
      data: response.data?.filters || response.data || [],
      message: response.message || 'Success',
      pagination: response.data?.pagination,
    };
  }

  async getBySlug(slug: string): Promise<ApiResponse<Filter>> {
    return await adminApiClient.get<ApiResponse<Filter>>(`/admin/filters/${slug}`);
  }

  async create(data: FilterCreateRequest): Promise<ApiResponse<Filter>> {
    return await adminApiClient.post<ApiResponse<Filter>>('/admin/filters', data);
  }

  async update(slug: string, data: FilterUpdateRequest): Promise<ApiResponse<Filter>> {
    return await adminApiClient.put<ApiResponse<Filter>>(
      `/admin/filters/${slug}`,
      data
    );
  }

  async delete(slug: string): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/filters/${slug}`);
  }

  // Filter-Category assignment operations
  async assignToCategory(categoryId: number, filterId: number): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/filters/categories/${categoryId}/filters/${filterId}`
    );
  }

  async removeFromCategory(categoryId: number, filterId: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(
      `/admin/filters/categories/${categoryId}/filters/${filterId}`
    );
  }

  // Filter option operations
  async getOptions(filterSlug: string): Promise<ApiResponse<FilterOption[]>> {
    return await adminApiClient.get<ApiResponse<FilterOption[]>>(
      `/admin/filters/${filterSlug}/options`
    );
  }

  async getOptionById(filterSlug: string, optionId: number): Promise<ApiResponse<FilterOption>> {
    return await adminApiClient.get<ApiResponse<FilterOption>>(
      `/admin/filters/${filterSlug}/options/${optionId}`
    );
  }

  async createOption(
    filterSlug: string,
    data: FilterOptionCreateRequest
  ): Promise<ApiResponse<FilterOption>> {
    return await adminApiClient.post<ApiResponse<FilterOption>>(
      `/admin/filters/${filterSlug}/options`,
      data
    );
  }

  async updateOption(
    filterSlug: string,
    optionId: number,
    data: FilterOptionUpdateRequest
  ): Promise<ApiResponse<FilterOption>> {
    return await adminApiClient.put<ApiResponse<FilterOption>>(
      `/admin/filters/${filterSlug}/options/${optionId}`,
      data
    );
  }

  async deleteOption(filterSlug: string, optionId: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(
      `/admin/filters/${filterSlug}/options/${optionId}`
    );
  }

  // Batch category assignment operations
  async batchAssignToCategories(
    filterId: number,
    categoryIds: number[],
    action: 'assign' | 'remove'
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/filters/${filterId}/categories/batch`,
      { category_ids: categoryIds, action }
    );
  }

  // Get filter's assigned categories
  async getFilterCategories(filterId: number): Promise<ApiResponse<number[]>> {
    return await adminApiClient.get<ApiResponse<number[]>>(
      `/admin/filters/${filterId}/categories`
    );
  }
}

export const filterAdminRepository = new FilterAdminRepository();
