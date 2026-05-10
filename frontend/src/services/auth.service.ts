import type { ApiResponse } from "@/types/api";
import type { AuthSession, LoginPayload, RegisterPayload } from "@/types/auth";
import { apiClient } from "@/lib/api/api-client";

type BackendAuthPayload = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: AuthSession["user"]["role"];
    departmentLevel?: number;
    departmentCode?: string;
    departmentName?: string;
    forcePasswordChange?: boolean;
  };
};

function toIsoExpiry(expiresIn?: number) {
  if (!expiresIn) {
    return undefined;
  }

  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

function mapAuthSession(payload: BackendAuthPayload): AuthSession {
  return {
    user: {
      id: payload.user.id,
      fullName: payload.user.fullName,
      email: payload.user.email,
      role: payload.user.role,
      departmentLevel: payload.user.departmentLevel,
      departmentCode: payload.user.departmentCode,
      forcePasswordChange: payload.user.forcePasswordChange ?? false,
    },
    tokens: {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      tokenType: payload.tokenType,
      expiresAt: toIsoExpiry(payload.expiresIn),
    },
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<ApiResponse<AuthSession>> {
    const response = await apiClient.post<ApiResponse<BackendAuthPayload>>(
      "/auth/login",
      payload,
    );

    return {
      ...response,
      success: response.success ?? true,
      data: mapAuthSession(response.data),
    };
  },

  async register(payload: RegisterPayload): Promise<ApiResponse<AuthSession>> {
    const response = await apiClient.post<ApiResponse<BackendAuthPayload>>(
      "/auth/register",
      payload,
    );

    return {
      ...response,
      success: response.success ?? true,
      data: mapAuthSession(response.data),
    };
  },

  logout() {
    return apiClient.post<ApiResponse<null>>("/auth/logout", undefined, {
      authenticated: true,
    });
  },

  async me(): Promise<ApiResponse<AuthSession["user"]>> {
    const response = await apiClient.get<
      ApiResponse<BackendAuthPayload["user"]>
    >("/auth/me", {
      authenticated: true,
    });

    return {
      ...response,
      success: response.success ?? true,
      data: {
        id: response.data.id,
        fullName: response.data.fullName,
        email: response.data.email,
        role: response.data.role,
        departmentLevel: response.data.departmentLevel,
        departmentCode: response.data.departmentCode,
      },
    };
  },

  forgotPassword(email: string) {
    return apiClient.post<ApiResponse<{ token?: string }>>(
      "/auth/forgot-password",
      {
        email,
      },
    );
  },

  resetPassword(payload: {
    token: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiClient.post<ApiResponse<null>>("/auth/reset-password", payload);
  },

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<AuthSession["tokens"]>> {
    const response = await apiClient.post<ApiResponse<BackendAuthPayload>>(
      "/auth/refresh-token",
      {
        refreshToken,
      },
    );

    return {
      ...response,
      success: response.success ?? true,
      data: mapAuthSession(response.data).tokens,
    };
  },

  changePasswordFirstLogin(newPassword: string) {
    return apiClient.post<ApiResponse<null>>(
      "/auth/change-password-first-login",
      { newPassword },
      { authenticated: true },
    );
  },
};
