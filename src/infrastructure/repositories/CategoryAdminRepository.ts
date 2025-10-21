import { adminApiClient } from '../api/adminApiClient';
import {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from '@/domain/entities/Category';
import { Filter } from '@/domain/entities/Filter';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class CategoryAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<Category[]>> {
    const response = await adminApiClient.get<any>('/admin/categories', { params });
    // Transform response from {data: {categories: [...]}} to {data: [...]}
    return {
      success: true,
      data: response.data?.categories || [],
      message: response.message || 'Success',
      pagination: response.data?.pagination,
    };
  }

  async getById(id: number): Promise<ApiResponse<Category>> {
    const response = await adminApiClient.get<any>(`/admin/categories/${id}`);
    // Transform response from {data: {category: {...}}} to {data: {...}}
    return {
      success: true,
      data: response.data?.category || null,
      message: response.message || 'Success',
    };
  }

  async create(data: CategoryCreateRequest): Promise<ApiResponse<Category>> {
    return await adminApiClient.post<ApiResponse<Category>>('/admin/categories', data);
  }

  async update(id: number, data: CategoryUpdateRequest): Promise<ApiResponse<Category>> {
    return await adminApiClient.put<ApiResponse<Category>>(
      `/admin/categories/${id}`,
      data
    );
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/categories/${id}`);
  }

  async activate(id: number): Promise<ApiResponse<Category>> {
    return await adminApiClient.patch<ApiResponse<Category>>(
      `/admin/categories/${id}/activate`
    );
  }

  async deactivate(id: number): Promise<ApiResponse<Category>> {
    return await adminApiClient.patch<ApiResponse<Category>>(
      `/admin/categories/${id}/deactivate`
    );
  }

  async getCategoryFilters(categoryId: number): Promise<ApiResponse<Filter[]>> {
    const response = await adminApiClient.get<any>(`/admin/categories/${categoryId}/filters`);
    // Transform response from {data: {filters: [...]}} to {data: [...]}
    return {
      success: true,
      data: response.data?.filters || [],
      message: response.message || 'Success',
    };
  }
}

export const categoryAdminRepository = new CategoryAdminRepository();
