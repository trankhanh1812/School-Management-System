import { env } from "@/lib/env";
import { fetchJson } from "@/lib/api/fetch-json";
import { getStoredTokens } from "@/lib/auth/token-storage";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

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
    return fetchJson<T>(`${env.apiBaseUrl}${path}`, {
      ...options,
      headers: buildHeaders(options?.headers, options?.authenticated),
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
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
