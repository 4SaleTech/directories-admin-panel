import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Hardcoded API URLs based on environment
const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: default to production
    return 'https://directories-apis.q84sale.com/api/v2';
  }

  // Client-side: detect environment from hostname
  const hostname = window.location.hostname;

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Local development
    return 'http://localhost:8080/api/v2';
  } else if (hostname.includes('staging')) {
    // Staging environment
    return 'https://staging-directories-apis.q84sale.com/api/v2';
  } else if (hostname.includes('dev') || hostname.includes('integration')) {
    // Dev environment
    return 'https://dev-directories-apis.q84sale.com/api/v2';
  } else {
    // Production environment (directories-admin.q84sale.com)
    return 'https://directories-apis.q84sale.com/api/v2';
  }
};

export class AdminApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private clientInitialized: boolean = false;

  constructor() {
    // Get API URL - will re-evaluate on client side
    const apiBaseUrl = getApiBaseUrl();

    this.client = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor to add auth token and reinitialize baseURL on client
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Reinitialize baseURL on first client-side request
        if (!this.clientInitialized && typeof window !== 'undefined') {
          const clientBaseUrl = getApiBaseUrl();
          this.client.defaults.baseURL = clientBaseUrl;
          this.clientInitialized = true;
        }

        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export a singleton instance
export const adminApiClient = new AdminApiClient();
