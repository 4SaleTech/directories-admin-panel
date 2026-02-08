"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Admin, AdminAuthContext } from "@/domain/entities/Admin";
import { authRepository } from "@/infrastructure/repositories/AuthRepository";
import { adminApiClient } from "@/infrastructure/api/adminApiClient";
import {
  adminConsoleAuthService,
  ConsoleTokenPayload,
} from "@/infrastructure/services/AdminConsoleAuthService";

const AuthContext = createContext<AdminAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConsoleAuth, setIsConsoleAuth] = useState(false);
  const [consolePayload, setConsolePayload] =
    useState<ConsoleTokenPayload | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      // Check for existing console auth in session first
      const isConsoleAuthStored =
        sessionStorage.getItem("console_auth") === "true";
      const storedToken = adminApiClient.getToken();
      const storedAdmin = localStorage.getItem("admin_user");

      if (isConsoleAuthStored) {
        // Restore console auth from session immediately
        const storedPayload = sessionStorage.getItem("console_payload");
        if (storedPayload && storedToken && storedAdmin) {
          try {
            setToken(storedToken);
            setAdmin(JSON.parse(storedAdmin));
            setIsConsoleAuth(true);
            setConsolePayload(JSON.parse(storedPayload));
            setIsLoading(false);
            return;
          } catch (error) {
            console.error("Failed to restore console auth:", error);
            sessionStorage.removeItem("console_auth");
            sessionStorage.removeItem("console_payload");
          }
        }
      }

      // Try Admin Console authentication
      const apiBaseUrl =
        adminApiClient.getClient().defaults.baseURL ||
        "http://localhost:8080/api/v2";

      // Check if there's a token in URL to attempt Console auth
      const hasTokenInURL =
        typeof window !== "undefined" &&
        window.location.search.includes("admin_token=");

      if (hasTokenInURL) {
        try {
          await adminConsoleAuthService.initialize(
            apiBaseUrl,
            // On successful console authentication
            async (payload: ConsoleTokenPayload, consoleToken: string) => {
              console.log(
                "[AuthProvider] Admin Console authentication successful",
                payload,
              );

              // Optionally fetch full profile from /me endpoint for additional info
              let fullProfile = payload;
              try {
                const profile =
                  await adminConsoleAuthService.getAdminProfile(consoleToken);
                if (profile) {
                  fullProfile = profile;
                  console.log(
                    "[AuthProvider] Fetched full admin profile from Console",
                  );
                }
              } catch (error) {
                console.log(
                  "[AuthProvider] Could not fetch full profile, using token payload",
                );
              }

              // Create admin object from console payload
              const consoleAdmin: Admin = {
                id: 0, // Console doesn't provide numeric ID
                username:
                  fullProfile.display_name ||
                  fullProfile.username ||
                  fullProfile.admin_id,
                email: fullProfile.email || `${fullProfile.admin_id}@console`,
                role: fullProfile.roles.includes("Super Admin")
                  ? "super_admin"
                  : "admin",
                is_active: true,
                created_at: new Date(
                  fullProfile.issued_at * 1000,
                ).toISOString(),
                updated_at: new Date().toISOString(),
              };

              setAdmin(consoleAdmin);
              // Use the Console token directly for all API calls
              setToken(consoleToken);
              setIsConsoleAuth(true);
              setConsolePayload(fullProfile);
              adminApiClient.setToken(consoleToken);

              // Store console auth flag
              sessionStorage.setItem("console_auth", "true");
              sessionStorage.setItem(
                "console_payload",
                JSON.stringify(fullProfile),
              );
              localStorage.setItem("admin_user", JSON.stringify(consoleAdmin));

              setIsLoading(false);
            },
            // On console auth error
            (error: string) => {
              console.log("[AuthProvider] Admin Console auth failed:", error);
              // Fall back to regular authentication
              checkRegularAuth();
            },
          );
        } catch (error) {
          console.log(
            "[AuthProvider] Console auth initialization failed, using regular auth",
          );
          checkRegularAuth();
        }
      } else {
        // No token in URL, check regular auth
        checkRegularAuth();
      }
    };

    const checkRegularAuth = () => {
      // Check if user is logged in with regular auth
      const storedToken = adminApiClient.getToken();
      const storedAdmin = localStorage.getItem("admin_user");

      if (storedToken && storedAdmin) {
        // Regular authentication
        try {
          setToken(storedToken);
          setAdmin(JSON.parse(storedAdmin));
          setIsConsoleAuth(false);
        } catch (error) {
          console.error("Failed to parse stored admin:", error);
          adminApiClient.clearToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authRepository.login(username, password);
      if (response.data) {
        const { admin: adminData, token: authToken } = response.data;
        setAdmin(adminData);
        setToken(authToken);
        setIsConsoleAuth(false);
        setConsolePayload(null);
        adminApiClient.setToken(authToken);
        localStorage.setItem("admin_user", JSON.stringify(adminData));
        sessionStorage.removeItem("console_auth");
        sessionStorage.removeItem("console_payload");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    setIsConsoleAuth(false);
    setConsolePayload(null);
    authRepository.logout();
    sessionStorage.removeItem("console_auth");
    sessionStorage.removeItem("console_payload");
  };

  const hasPermission = (permission: string): boolean => {
    if (!isConsoleAuth || !consolePayload) return true; // Regular auth has all permissions
    return adminConsoleAuthService.hasPermission(consolePayload, permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isConsoleAuth || !consolePayload) return true;
    return adminConsoleAuthService.hasAnyPermission(
      consolePayload,
      permissions,
    );
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isConsoleAuth || !consolePayload) return true;
    return adminConsoleAuthService.hasAllPermissions(
      consolePayload,
      permissions,
    );
  };

  const isSuperAdmin = (): boolean => {
    if (!isConsoleAuth || !consolePayload) {
      return admin?.role === "super_admin";
    }
    return adminConsoleAuthService.isSuperAdmin(consolePayload);
  };

  const value: AdminAuthContext = {
    admin,
    token,
    isAuthenticated: !!admin && !!token,
    login,
    logout,
    isConsoleAuth,
    consolePayload,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
