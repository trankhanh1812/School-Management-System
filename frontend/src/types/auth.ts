import type { UserRole } from "@/constants/roles";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  departmentLevel?: number;
  departmentCode?: string;
  /** Nếu true, user phải đổi mật khẩu trước khi vào dashboard */
  forcePasswordChange?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  tokenType?: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};
