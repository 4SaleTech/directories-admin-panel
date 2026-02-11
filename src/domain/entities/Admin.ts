import { ConsoleTokenPayload } from "@/infrastructure/services/AdminConsoleAuthService";

export interface Admin {
  id: number;
  username: string;
  email: string;
  role: "super_admin" | "admin" | "moderator";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  message: string;
  data: {
    admin: Admin;
    token: string;
    expires_at: string;
  };
}

export interface AdminAuthContext {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isConsoleAuth: boolean;
  consolePayload: ConsoleTokenPayload | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isSuperAdmin: () => boolean;
}
