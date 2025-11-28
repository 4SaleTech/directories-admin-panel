import { adminApiClient } from '../api/adminApiClient';
import {
  Business,
  BusinessCreateRequest,
  BusinessUpdateRequest,
  BusinessListParams,
} from '@/domain/entities/Business';
import { ApiResponse, PaginatedResponse } from '@/domain/entities/ApiResponse';

export class BusinessAdminRepository {
  // Transform API business response to Business entity
  private transformBusiness(apiBusiness: any): Business {
    return {
      ...apiBusiness,
      is_verified: apiBusiness.attributes?.verified === 'true',
      is_featured: apiBusiness.attributes?.featured === 'true',
      rating: apiBusiness.rating_avg || undefined,
      total_reviews: apiBusiness.rating_count || undefined,
    };
  }

  async getAll(params?: BusinessListParams): Promise<PaginatedResponse<Business>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.is_verified !== undefined)
      queryParams.append('is_verified', params.is_verified.toString());
    if (params?.is_featured !== undefined)
      queryParams.append('is_featured', params.is_featured.toString());
    if (params?.has_logo !== undefined)
      queryParams.append('has_logo', params.has_logo.toString());
    if (params?.category_id)
      queryParams.append('category_id', params.category_id.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort) queryParams.append('sort', params.sort);

    // Handle dynamic filters (supports both single-value and multi-select filters)
    // Multi-select filters are converted to comma-separated strings
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Multi-select filter: join array into comma-separated string
          if (value.length > 0) {
            queryParams.append(key, value.join(','));
          }
        } else if (value) {
          // Single-value filter
          queryParams.append(key, value);
        }
      });
    }

    const url = `/admin/businesses?${queryParams.toString()}`;
    const response = await adminApiClient.get<any>(url);

    // Transform response from {data: {businesses: [...], meta: {...}}} to {data: [...], pagination: {...}}
    const businesses = (response.data?.businesses || []).map((b: any) => this.transformBusiness(b));

    return {
      success: true,
      data: businesses,
      pagination: response.data?.meta ? {
        page: response.data.meta.current_page,
        limit: response.data.meta.per_page,
        total: response.data.meta.total_count,
        total_pages: response.data.meta.total_pages,
      } : {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      },
      message: response.message || 'Success',
    };
  }

  async getById(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.get<ApiResponse<Business>>(`/admin/businesses/${id}`);
  }

  async create(data: BusinessCreateRequest): Promise<ApiResponse<Business>> {
    return await adminApiClient.post<ApiResponse<Business>>('/admin/businesses', data);
  }

  async update(id: number, data: BusinessUpdateRequest): Promise<ApiResponse<Business>> {
    return await adminApiClient.put<ApiResponse<Business>>(
      `/admin/businesses/${id}`,
      data
    );
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return await adminApiClient.delete<ApiResponse<void>>(`/admin/businesses/${id}`);
  }

  async verify(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/verify`
    );
  }

  async unverify(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/unverify`
    );
  }

  async feature(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/feature`
    );
  }

  async unfeature(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/unfeature`
    );
  }

  async suspend(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/suspend`
    );
  }

  async unsuspend(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/unsuspend`
    );
  }

  async activate(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/activate`
    );
  }

  async deactivate(id: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.patch<ApiResponse<Business>>(
      `/admin/businesses/${id}/deactivate`
    );
  }

  async setLogoFromMedia(id: number, mediaId: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.put<ApiResponse<Business>>(
      `/admin/businesses/${id}/logo`,
      { media_id: mediaId }
    );
  }

  async setCoverFromMedia(id: number, mediaId: number): Promise<ApiResponse<Business>> {
    return await adminApiClient.put<ApiResponse<Business>>(
      `/admin/businesses/${id}/cover`,
      { media_id: mediaId }
    );
  }

  async setLogoAndCoverFromMedia(
    id: number,
    logoMediaId: number,
    coverMediaId: number
  ): Promise<ApiResponse<Business>> {
    return await adminApiClient.put<ApiResponse<Business>>(
      `/admin/businesses/${id}/logo-and-cover`,
      {
        logo_media_id: logoMediaId,
        cover_media_id: coverMediaId,
      }
    );
  }
}

export const businessAdminRepository = new BusinessAdminRepository();
