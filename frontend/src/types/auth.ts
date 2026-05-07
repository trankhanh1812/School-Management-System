import type { UserRole } from "@/constants/roles";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  departmentLevel?: number; // 1 = Head, 2 = Vice, 3 = Regular
  departmentCode?: string;
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
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};
