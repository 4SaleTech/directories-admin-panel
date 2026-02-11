"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Debug logging flag - only enable in development
const DEBUG_AUTH =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";
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
        const storedAdminSession = sessionStorage.getItem("admin_user");
        if (storedPayload && storedToken && storedAdminSession) {
          try {
            setToken(storedToken);
            setAdmin(JSON.parse(storedAdminSession));
            setIsConsoleAuth(true);
            setConsolePayload(JSON.parse(storedPayload));
            setIsLoading(false);
            return;
          } catch (error) {
            console.error("Failed to restore console auth:", error);
            sessionStorage.removeItem("console_auth");
            sessionStorage.removeItem("console_payload");
            sessionStorage.removeItem("admin_user");
            adminApiClient.clearToken();
          }
        }
      }

      // Try Admin Console authentication
      const apiBaseUrl =
        adminApiClient.getClient().defaults.baseURL ||
        "http://localhost:8080/api/v2";

      // Determine whether we should initialize Console auth.
      // We do this either when an admin token is present in the URL or
      // when the app is embedded in an iframe (postMessage-only flow).
      const isBrowser = typeof window !== "undefined";
      const hasTokenInURL =
        isBrowser && window.location.search.includes("admin_token=");
      const isEmbeddedInIframe = isBrowser && window.parent !== window;

      if (hasTokenInURL || isEmbeddedInIframe) {
        try {
          await adminConsoleAuthService.initialize(
            apiBaseUrl,
            // On successful console authentication
            async (payload: ConsoleTokenPayload, consoleToken: string) => {
              if (DEBUG_AUTH) {
                console.log(
                  "[AuthProvider] Admin Console authentication successful",
                );
              }

              // Optionally fetch full profile from /me endpoint for additional info
              let fullProfile = payload;
              try {
                const profile =
                  await adminConsoleAuthService.getAdminProfile(consoleToken);
                if (profile) {
                  fullProfile = profile;
                  if (DEBUG_AUTH) {
                    console.log(
                      "[AuthProvider] Fetched full admin profile from Console",
                    );
                  }
                }
              } catch (error) {
                if (DEBUG_AUTH) {
                  console.log(
                    "[AuthProvider] Could not fetch full profile, using token payload",
                  );
                }
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
              adminApiClient.setToken(consoleToken, true); // sessionOnly = true for Console auth

              // Store console auth flag and data in sessionStorage only (tab-scoped)
              sessionStorage.setItem("console_auth", "true");
              sessionStorage.setItem(
                "console_payload",
                JSON.stringify(fullProfile),
              );
              sessionStorage.setItem(
                "admin_user",
                JSON.stringify(consoleAdmin),
              );

              setIsLoading(false);
            },
            // On console auth error
            (error: string) => {
              if (DEBUG_AUTH) {
                console.log("[AuthProvider] Admin Console auth failed:", error);
              }
              // Fall back to regular authentication
              checkRegularAuth();
            },
          );
        } catch (error) {
          if (DEBUG_AUTH) {
            console.log(
              "[AuthProvider] Console auth initialization failed, using regular auth",
            );
          }
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
        adminApiClient.setToken(authToken, false); // sessionOnly = false for regular auth
        localStorage.setItem("admin_user", JSON.stringify(adminData));
        // Clear any Console auth session data
        sessionStorage.removeItem("console_auth");
        sessionStorage.removeItem("console_payload");
        sessionStorage.removeItem("admin_user");
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
    // Clear all auth data from both storage types
    sessionStorage.removeItem("console_auth");
    sessionStorage.removeItem("console_payload");
    sessionStorage.removeItem("admin_user");
    localStorage.removeItem("admin_user");
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
