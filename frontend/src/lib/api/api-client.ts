import { env } from "@/lib/env";
import { fetchJson } from "@/lib/api/fetch-json";
import { ApiError } from "@/lib/api/api-error";
import {
  clearStoredSession,
  getStoredTokens,
  updateStoredTokens,
} from "@/lib/auth/token-storage";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

// Shared so that N concurrent 401s trigger exactly one refresh call, not N.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    return null;
  }

  try {
    // Call the endpoint directly (not via authService) to avoid an import cycle,
    // and unauthenticated so a stale/expired access token can't block the refresh.
    const payload = await fetchJson<{
      data?: { accessToken?: string; refreshToken?: string };
    }>(`${env.apiBaseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    const next = payload?.data;
    if (!next?.accessToken) {
      return null;
    }

    const nextRefreshToken = next.refreshToken ?? tokens.refreshToken;
    updateStoredTokens(next.accessToken, nextRefreshToken);

    // Let the AuthProvider refresh its in-memory session so token-dependent
    // consumers (e.g. the notification WebSocket) reconnect with the new token
    // instead of silently dying once the old access token expires.
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth-tokens-refreshed", {
          detail: {
            accessToken: next.accessToken,
            refreshToken: nextRefreshToken,
          },
        }),
      );
    }

    return next.accessToken;
  } catch {
    return null;
  }
}

function buildHeaders(initHeaders?: HeadersInit, authenticated?: boolean) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
    }
  }

  return headers;
}

export const apiClient = {
  async request<T>(path: string, options?: RequestOptions) {
    const authenticated = options?.authenticated;
    const doFetch = () =>
      fetchJson<T>(`${env.apiBaseUrl}${path}`, {
        ...options,
        headers: buildHeaders(options?.headers, authenticated),
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

    try {
      return await doFetch();
    } catch (error) {
      // On an expired access token, silently refresh once and retry. Skip the
      // refresh endpoint itself to avoid a loop.
      const isAuthExpiry =
        authenticated &&
        error instanceof ApiError &&
        error.status === 401 &&
        !path.startsWith("/auth/refresh-token");

      if (!isAuthExpiry) {
        throw error;
      }

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        // buildHeaders() re-reads storage, so the retry uses the fresh token.
        return await doFetch();
      }

      // Refresh failed (refresh token also expired/invalid) → force re-login.
      clearStoredSession();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
      throw error;
    }
  },

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "POST", body });
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  },
};
