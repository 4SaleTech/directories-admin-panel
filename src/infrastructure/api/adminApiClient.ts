import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// Get API URL from environment variable or fallback to detecting from hostname
const getApiBaseUrl = (): string => {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window === "undefined") {
    // Server-side: default to production
    return "https://directories-apis.q84sale.com/api/v2";
  }

  // Client-side: detect environment from hostname
  const hostname = window.location.hostname;

  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // Local development
    return "http://localhost:8080/api/v2";
  } else if (hostname.includes("staging")) {
    // Staging environment
    return "https://staging-directories-apis.q84sale.com/api/v2";
  } else if (hostname.includes("dev") || hostname.includes("integration")) {
    // Dev environment
    return "https://dev-directories-apis.q84sale.com/api/v2";
  } else {
    // Production environment (directories-admin.q84sale.com)
    return "https://directories-apis.q84sale.com/api/v2";
  }
};

export class AdminApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private clientInitialized: boolean = false;
  private isSessionOnly: boolean = false; // Flag for Console auth tokens

  constructor() {
    // Get API URL - will re-evaluate on client side
    const apiBaseUrl = getApiBaseUrl();

    this.client = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor to add auth token and reinitialize baseURL on client
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Reinitialize baseURL on first client-side request
        if (!this.clientInitialized && typeof window !== "undefined") {
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
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Check if this is Console auth - if so, don't auto-logout
          const isConsoleAuth =
            typeof window !== "undefined" &&
            sessionStorage.getItem("console_auth") === "true";

          if (!isConsoleAuth) {
            // Token expired or invalid for regular auth
            this.clearToken();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
          // For Console auth, let the error propagate without auto-logout
        }
        return Promise.reject(error);
      },
    );

    // Load token from sessionStorage (Console) or localStorage (regular) on initialization
    if (typeof window !== "undefined") {
      const sessionToken = sessionStorage.getItem("admin_token");
      const localToken = localStorage.getItem("admin_token");

      if (sessionToken) {
        // Console auth token
        this.token = sessionToken;
        this.isSessionOnly = true;
      } else if (localToken) {
        // Regular auth token
        this.token = localToken;
        this.isSessionOnly = false;
      }
    }
  }

  setToken(token: string, sessionOnly: boolean = false) {
    this.token = token;
    this.isSessionOnly = sessionOnly;
    if (typeof window !== "undefined") {
      if (sessionOnly) {
        // Console auth: store in sessionStorage only
        sessionStorage.setItem("admin_token", token);
        localStorage.removeItem("admin_token"); // Remove any existing persistent token
      } else {
        // Regular auth: store in localStorage
        localStorage.setItem("admin_token", token);
        sessionStorage.removeItem("admin_token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    this.isSessionOnly = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");
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
