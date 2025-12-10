'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Admin, AdminAuthContext } from '@/domain/entities/Admin';
import { authRepository } from '@/infrastructure/repositories/AuthRepository';
import { adminApiClient } from '@/infrastructure/api/adminApiClient';

const AuthContext = createContext<AdminAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedToken = adminApiClient.getToken();
    const storedAdmin = localStorage.getItem('admin_user');

    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        console.error('Failed to parse stored admin:', error);
        adminApiClient.clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authRepository.login(username, password);
      if (response.data) {
        const { admin: adminData, token: authToken } = response.data;
        setAdmin(adminData);
        setToken(authToken);
        adminApiClient.setToken(authToken);
        localStorage.setItem('admin_user', JSON.stringify(adminData));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    authRepository.logout();
  };

  const value: AdminAuthContext = {
    admin,
    token,
    isAuthenticated: !!admin && !!token,
    login,
    logout,
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
