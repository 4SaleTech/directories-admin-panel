import { adminApiClient } from '../api/adminApiClient';
import { Admin, AdminLoginRequest, AdminLoginResponse } from '@/domain/entities/Admin';
import { ApiResponse } from '@/domain/entities/ApiResponse';

export class AuthRepository {
  async login(username: string, password: string): Promise<AdminLoginResponse> {
    const response = await adminApiClient.post<AdminLoginResponse>(
      '/admin/auth/login',
      { username, password }
    );
    return response;
  }

  async getCurrentAdmin(): Promise<ApiResponse<Admin>> {
    const response = await adminApiClient.get<ApiResponse<Admin>>('/admin/auth/me');
    return response;
  }

  async logout(): Promise<void> {
    adminApiClient.clearToken();
  }
}

export const authRepository = new AuthRepository();
