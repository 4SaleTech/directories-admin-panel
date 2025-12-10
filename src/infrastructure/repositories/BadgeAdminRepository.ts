import { adminApiClient } from '../api/adminApiClient';
import {
  Badge,
  CreateBadgeRequest,
  UpdateBadgeRequest,
  BadgeAssignmentRequest,
} from '@/domain/entities/Badge';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class BadgeAdminRepository {
  async getAll(params?: any): Promise<ApiResponse<Badge[]>> {
    const response = await adminApiClient.get<any>('/admin/badges', { params });
    return {
      success: true,
      data: response.data?.badges || [],
      message: response.message || 'Success',
      pagination: response.data?.pagination,
    };
  }

  async getById(id: number): Promise<ApiResponse<Badge>> {
    const response = await adminApiClient.get<any>(`/admin/badges/${id}`);
    return {
      success: true,
      data: response.data?.badge || null,
      message: response.message || 'Success',
    };
  }

  async create(data: CreateBadgeRequest): Promise<ApiResponse<Badge>> {
    return await adminApiClient.post<ApiResponse<Badge>>('/admin/badges', data);
  }

  async update(id: number, data: UpdateBadgeRequest): Promise<ApiResponse<Badge>> {
    return await adminApiClient.put<ApiResponse<Badge>>(
      `/admin/badges/${id}`,
      data
    );
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/badges/${id}`);
  }

  async activate(id: number): Promise<ApiResponse<Badge>> {
    return await adminApiClient.patch<ApiResponse<Badge>>(
      `/admin/badges/${id}/activate`
    );
  }

  async deactivate(id: number): Promise<ApiResponse<Badge>> {
    return await adminApiClient.patch<ApiResponse<Badge>>(
      `/admin/badges/${id}/deactivate`
    );
  }

  // Category badge assignments
  async getCategoryBadges(categoryId: number): Promise<ApiResponse<Badge[]>> {
    const response = await adminApiClient.get<any>(`/admin/badges/categories/${categoryId}/badges`);
    return {
      success: true,
      data: response.data?.badges || [],
      message: response.message || 'Success',
    };
  }

  async assignBadgesToCategory(
    categoryId: number,
    badgeIds: number[]
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/badges/categories/${categoryId}/badges`,
      { badge_ids: badgeIds }
    );
  }

  async unassignBadgeFromCategory(
    categoryId: number,
    badgeId: number
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(
      `/admin/badges/categories/${categoryId}/badges/${badgeId}`
    );
  }

  // Business badge assignments
  async getBusinessBadges(businessId: number): Promise<ApiResponse<Badge[]>> {
    const response = await adminApiClient.get<any>(`/admin/badges/businesses/${businessId}/badges`);
    return {
      success: true,
      data: response.data?.badges || [],
      message: response.message || 'Success',
    };
  }

  async assignBadgesToBusiness(
    businessId: number,
    badgeIds: number[]
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/badges/businesses/${businessId}/badges`,
      { badge_ids: badgeIds }
    );
  }

  async unassignBadgeFromBusiness(
    businessId: number,
    badgeId: number
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(
      `/admin/badges/businesses/${businessId}/badges/${badgeId}`
    );
  }

  // Section badge assignments
  async getSectionBadges(sectionId: number): Promise<ApiResponse<Badge[]>> {
    const response = await adminApiClient.get<any>(`/admin/badges/sections/${sectionId}/badges`);
    return {
      success: true,
      data: response.data?.badges || [],
      message: response.message || 'Success',
    };
  }

  async assignBadgesToSection(
    sectionId: number,
    badgeIds: number[]
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.post<ApiResponse<void>>(
      `/admin/badges/sections/${sectionId}/badges`,
      { badge_ids: badgeIds }
    );
  }

  async unassignBadgeFromSection(
    sectionId: number,
    badgeId: number
  ): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(
      `/admin/badges/sections/${sectionId}/badges/${badgeId}`
    );
  }
}

export const badgeAdminRepository = new BadgeAdminRepository();
