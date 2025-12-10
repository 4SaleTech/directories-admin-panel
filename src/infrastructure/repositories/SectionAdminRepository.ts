import { adminApiClient } from '../api/adminApiClient';
import {
  Section,
  SectionCreateRequest,
  SectionUpdateRequest,
} from '@/domain/entities/Section';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class SectionAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<Section[]>> {
    const response = await adminApiClient.get<any>('/admin/sections', { params });
    return {
      success: true,
      data: response.data?.sections || response.data || [],
      message: response.message || 'Success',
      pagination: response.data?.pagination,
    };
  }

  async getById(id: number): Promise<ApiResponse<Section>> {
    return await adminApiClient.get<ApiResponse<Section>>(`/admin/sections/${id}`);
  }

  async create(data: SectionCreateRequest): Promise<ApiResponse<Section>> {
    return await adminApiClient.post<ApiResponse<Section>>('/admin/sections', data);
  }

  async update(id: number, data: SectionUpdateRequest): Promise<ApiResponse<Section>> {
    return await adminApiClient.put<ApiResponse<Section>>(
      `/admin/sections/${id}`,
      data
    );
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/sections/${id}`);
  }

  async activate(id: number): Promise<ApiResponse<Section>> {
    return await adminApiClient.patch<ApiResponse<Section>>(
      `/admin/sections/${id}/activate`
    );
  }

  async deactivate(id: number): Promise<ApiResponse<Section>> {
    return await adminApiClient.patch<ApiResponse<Section>>(
      `/admin/sections/${id}/deactivate`
    );
  }
}

export const sectionAdminRepository = new SectionAdminRepository();
