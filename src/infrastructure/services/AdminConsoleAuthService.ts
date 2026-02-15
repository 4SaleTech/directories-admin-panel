/**
 * Admin Console Authentication Service
 *
 * Handles authentication integration with the Admin Console system.
 * Supports receiving tokens via URL parameters and postMessage API.
 */

// Debug logging flag - only enable in development
const DEBUG_AUTH =
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";

export interface ConsoleTokenPayload {
  admin_id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  roles: string[];
  permissions: string[];
  issued_at: number;
  exp: number;
}

export interface ConsoleVerifyResponse {
  valid: boolean;
  payload?: ConsoleTokenPayload;
  error?: string;
  admin_info?: {
    admin_id: string;
    roles: string[];
    permissions: string[];
    is_super_admin: boolean;
  };
  internal_message?: string;
}

export class AdminConsoleAuthService {
  private consoleOrigin: string;
  private verifyEndpoint: string;
  private messageListenerAttached: boolean = false;

  constructor() {
    // Get console URL from environment variable
    const consoleUrl =
      process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ||
      "https://admin-console.q84sale.com";

    // Normalize to origin only (scheme + host + port) for postMessage validation
    // This prevents issues with trailing slashes or paths in the env var
    try {
      this.consoleOrigin = new URL(consoleUrl).origin;
    } catch (error) {
      console.error("[AdminConsoleAuth] Invalid Console URL:", consoleUrl);
      this.consoleOrigin = "https://admin-console.q84sale.com";
    }

    this.verifyEndpoint = "/admin/console-auth/verify-token";
  }

  /**
   * Extract token from URL query parameter
   */
  extractTokenFromURL(): string | null {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("admin_token");

    if (token) {
      // Clean the URL to remove only the admin_token, preserving other params and hash
      const cleanedParams = new URLSearchParams(window.location.search);
      cleanedParams.delete("admin_token");
      const search = cleanedParams.toString();
      const newUrl =
        window.location.pathname +
        (search ? `?${search}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }

    return token;
  }

  /**
   * Setup postMessage listener to receive tokens from Admin Console
   */
  setupPostMessageListener(onTokenReceived: (token: string) => void): void {
    if (typeof window === "undefined" || this.messageListenerAttached) return;

    window.addEventListener("message", (event) => {
      // Validate origin
      if (event.origin !== this.consoleOrigin) {
        if (DEBUG_AUTH) {
          console.warn(
            "[AdminConsoleAuth] Received message from untrusted origin:",
            event.origin,
          );
        }
        return;
      }

      // Handle AUTH_TOKEN message
      if (event.data?.type === "AUTH_TOKEN" && event.data.token) {
        if (DEBUG_AUTH) {
          console.log("[AdminConsoleAuth] Received token via postMessage");
        }
        onTokenReceived(event.data.token);
      }
    });

    this.messageListenerAttached = true;
    if (DEBUG_AUTH) {
      console.log("[AdminConsoleAuth] PostMessage listener attached");
    }
  }

  /**
   * Signal to parent window that the app is ready to receive token
   */
  signalReady(): void {
    if (typeof window === "undefined") return;

    // Only send if we're in an iframe
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "ADMIN_APP_READY" },
        this.consoleOrigin,
      );
      if (DEBUG_AUTH) {
        console.log("[AdminConsoleAuth] Sent ADMIN_APP_READY signal");
      }
    }
  }

  /**
   * Request a fresh token from the parent console
   */
  requestToken(): void {
    if (typeof window === "undefined") return;

    if (window.parent !== window) {
      window.parent.postMessage({ type: "REQUEST_TOKEN" }, this.consoleOrigin);
      if (DEBUG_AUTH) {
        console.log("[AdminConsoleAuth] Requested fresh token");
      }
    }
  }

  /**
   * Verify token with backend
   */
  async verifyToken(
    token: string,
    apiBaseUrl: string,
  ): Promise<ConsoleVerifyResponse> {
    try {
      const response = await fetch(`${apiBaseUrl}${this.verifyEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const text = await response.text();

      if (!response.ok) {
        if (DEBUG_AUTH) {
          console.error(
            "[AdminConsoleAuth] Token verification failed with status:",
            response.status,
            "body:",
            text,
          );
        }
        let errorMessage = `Backend token verification failed with status ${response.status}`;
        if (text) {
          try {
            const errorJson = JSON.parse(text);
            if (typeof errorJson.error === "string") {
              errorMessage = errorJson.error;
            } else if (typeof errorJson.message === "string") {
              errorMessage = errorJson.message;
            }
          } catch {
            // Non-JSON error body; keep the default errorMessage
          }
        }
        return {
          valid: false,
          error: errorMessage,
        };
      }

      if (!text) {
        if (DEBUG_AUTH) {
          console.error(
            "[AdminConsoleAuth] Empty response from backend during token verification",
          );
        }
        return {
          valid: false,
          error: "Empty response from backend during token verification",
        };
      }

      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        if (DEBUG_AUTH) {
          console.error(
            "[AdminConsoleAuth] Failed to parse token verification response:",
            parseError,
            "body:",
            text,
          );
        }
        return {
          valid: false,
          error: "Invalid JSON response from backend during token verification",
        };
      }
    } catch (error) {
      if (DEBUG_AUTH) {
        console.error("[AdminConsoleAuth] Token verification failed:", error);
      }
      return {
        valid: false,
        error: "Failed to verify token with backend",
      };
    }
  }

  /**
   * Get admin profile from Console /me endpoint
   */
  async getAdminProfile(token: string): Promise<ConsoleTokenPayload | null> {
    try {
      const response = await fetch(`${this.consoleOrigin}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (DEBUG_AUTH) {
          console.error(
            "[AdminConsoleAuth] Failed to fetch profile:",
            response.status,
          );
        }
        return null;
      }

      const data = await response.json();

      // Map the response to ConsoleTokenPayload format
      return {
        admin_id: data.admin_id || data.id,
        username: data.username,
        email: data.email,
        display_name: data.displayName || data.display_name,
        avatar_url: data.avatar || data.avatar_url,
        roles: data.roles || [],
        permissions: data.permissions || [],
        issued_at: Math.floor(Date.now() / 1000),
        exp: data.exp || Math.floor(Date.now() / 1000) + 86400, // Default 24h
      };
    } catch (error) {
      console.error("[AdminConsoleAuth] Failed to get admin profile:", error);
      return null;
    }
  }

  /**
   * Check if a token has expired based on exp timestamp
   */
  isTokenExpired(payload: ConsoleTokenPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  /**
   * Check if admin has a specific permission
   */
  hasPermission(payload: ConsoleTokenPayload, permission: string): boolean {
    return payload.permissions.includes(permission);
  }

  /**
   * Check if admin has any of the specified permissions
   */
  hasAnyPermission(
    payload: ConsoleTokenPayload,
    permissions: string[],
  ): boolean {
    return permissions.some((permission) =>
      payload.permissions.includes(permission),
    );
  }

  /**
   * Check if admin has all of the specified permissions
   */
  hasAllPermissions(
    payload: ConsoleTokenPayload,
    permissions: string[],
  ): boolean {
    return permissions.every((permission) =>
      payload.permissions.includes(permission),
    );
  }

  /**
   * Check if admin has a specific role
   */
  hasRole(payload: ConsoleTokenPayload, role: string): boolean {
    return payload.roles.includes(role);
  }

  /**
   * Check if admin is a Super Admin
   */
  isSuperAdmin(payload: ConsoleTokenPayload): boolean {
    return this.hasRole(payload, "Super Admin");
  }

  /**
   * Initialize Admin Console authentication
   * Handles both URL parameter and postMessage methods
   */
  async initialize(
    apiBaseUrl: string,
    onAuthenticated: (payload: ConsoleTokenPayload, token: string) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    if (DEBUG_AUTH) {
      console.log("[AdminConsoleAuth] Initializing...");
    }

    // Try URL parameter first
    const urlToken = this.extractTokenFromURL();
    if (urlToken) {
      if (DEBUG_AUTH) {
        console.log("[AdminConsoleAuth] Token found in URL");
      }
      const result = await this.verifyToken(urlToken, apiBaseUrl);

      if (result.valid && result.payload) {
        if (DEBUG_AUTH) {
          console.log("[AdminConsoleAuth] Token verified successfully");
        }
        onAuthenticated(result.payload, urlToken);
        return;
      } else {
        if (DEBUG_AUTH) {
          console.error(
            "[AdminConsoleAuth] Token verification failed:",
            result.error,
          );
        }
        onError(result.error || "Invalid token");
        return;
      }
    }

    // Setup postMessage listener for iframe communication
    this.setupPostMessageListener(async (token) => {
      const result = await this.verifyToken(token, apiBaseUrl);

      if (result.valid && result.payload) {
        if (DEBUG_AUTH) {
          console.log("[AdminConsoleAuth] PostMessage token verified");
        }
        onAuthenticated(result.payload, token);
      } else {
        if (DEBUG_AUTH) {
          console.error(
            "[AdminConsoleAuth] PostMessage token verification failed:",
            result.error,
          );
        }
        onError(result.error || "Invalid token");
      }
    });

    // Signal readiness if in iframe
    this.signalReady();

    if (DEBUG_AUTH) {
      console.log(
        "[AdminConsoleAuth] Initialization complete, waiting for token...",
      );
    }
  }

  /**
   * Get console origin (for reference)
   */
  getOrigin(): string {
    return this.consoleOrigin;
  }
}

export const adminConsoleAuthService = new AdminConsoleAuthService();
