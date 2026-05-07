import type { UserRole } from "@/constants/roles";

const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  TEACHER: "/teaching-assignments",
  STUDENT: "/my-profile",
  PARENT: "/my-profile",
};

const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  ADMIN: ["/"],
  TEACHER: [
    "/dashboard",
    "/chat",
    "/students",
    "/teaching-assignments",
    "/scores",
    "/attendance",
    "/schedule",
    "/reports",
    "/notifications",
  ],
  STUDENT: [
    "/chat",
    "/my-profile",
    "/my-scores",
    "/my-scores/history",
    "/my-transcript",
    "/my-attendance",
    "/my-attendance/qr-scan",
    "/my-schedule",
    "/my-conduct",
    "/my-exams",
    "/notifications",
  ],
  PARENT: [
    "/chat",
    "/my-profile",
    "/my-scores",
    "/my-transcript",
    "/my-attendance",
    "/my-schedule",
    "/my-conduct",
    "/my-exams",
    "/notifications",
  ],
};

const TEACHER_BLOCKED_PATHS = [
  "/students/new",
  "/classes/new",
  "/subjects/new",
  "/teachers/new",
];

const TEACHER_BLOCKED_PATTERNS = [
  /^\/teaching-assignments\/[^/]+\/edit$/,
  /^\/students\/[^/]+\/edit$/,
  /^\/subjects\/[^/]+\/edit$/,
  /^\/teachers\/[^/]+\/edit$/,
  /^\/classes\/[^/]+\/edit$/,
];

export function getRoleHomeRoute(role: UserRole): string {
  return ROLE_HOME[role] ?? "/dashboard";
}

export function canAccessDashboardRoute(role: UserRole, pathname: string): boolean {
  if (!pathname.startsWith("/")) {
    return false;
  }

  if (role === "ADMIN") {
    return true;
  }

  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role] ?? [];
  const matchesAllowedPrefix = allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!matchesAllowedPrefix) {
    return false;
  }

  if (role === "TEACHER") {
    if (TEACHER_BLOCKED_PATHS.includes(pathname)) {
      return false;
    }

    if (TEACHER_BLOCKED_PATTERNS.some((pattern) => pattern.test(pathname))) {
      return false;
    }
  }

  return true;
}
