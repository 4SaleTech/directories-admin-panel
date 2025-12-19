import { adminApiClient } from '../api/adminApiClient';
import { Tag, TagCreateRequest, TagUpdateRequest } from '@/domain/entities/Tag';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class TagAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<Tag[]>> {
    const response = await adminApiClient.get<any>('/admin/tags', { params });
    return {
      success: true,
      data: response.data?.tags || response.data || [],
      message: response.message || 'Success',
      pagination: response.data?.pagination,
    };
  }

  async getById(id: number): Promise<ApiResponse<Tag>> {
    return await adminApiClient.get<ApiResponse<Tag>>(`/admin/tags/${id}`);
  }

  async create(data: TagCreateRequest): Promise<ApiResponse<Tag>> {
    return await adminApiClient.post<ApiResponse<Tag>>('/admin/tags', data);
  }

  async update(id: number, data: TagUpdateRequest): Promise<ApiResponse<Tag>> {
    return await adminApiClient.put<ApiResponse<Tag>>(`/admin/tags/${id}`, data);
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/tags/${id}`);
  }

  // Tag-Category assignment operations
  async assignToCategory(categoryId: number, tagId: number): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/tags/categories/${categoryId}/tags/${tagId}`
    );
  }

  async removeFromCategory(categoryId: number, tagId: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(
      `/admin/tags/categories/${categoryId}/tags/${tagId}`
    );
  }

  // Batch category assignment operations
  async batchAssignToCategories(
    tagId: number,
    categoryIds: number[],
    action: 'assign' | 'remove'
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/tags/${tagId}/categories/batch`,
      { category_ids: categoryIds, action }
    );
  }

  // Get tag's assigned categories
  async getTagCategories(tagId: number): Promise<ApiResponse<number[]>> {
    return await adminApiClient.get<ApiResponse<number[]>>(
      `/admin/tags/${tagId}/categories`
    );
  }
}

export const tagAdminRepository = new TagAdminRepository();
