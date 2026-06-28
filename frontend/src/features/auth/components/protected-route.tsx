"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { UserRole } from "@/constants/roles";
import {
  canAccessDashboardRoute,
  getRoleHomeRoute,
} from "@/shared/config/role-access";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAuthHydrated, session } = useAuthSession();

  const role = (session?.user.role ?? "STUDENT") as UserRole;
  const hasRouteAccess = canAccessDashboardRoute(role, pathname);

  useEffect(() => {
    if (!isAuthHydrated) {
      return;
    }

    if (!isAuthenticated) {
      const redirectTo = encodeURIComponent(pathname);
      router.replace(`/login?redirectTo=${redirectTo}`);
      return;
    }

    // Bắt buộc đổi mật khẩu trước khi vào dashboard
    if (session?.user.forcePasswordChange) {
      router.replace("/change-password-first-login");
      return;
    }

    if (!hasRouteAccess) {
      router.replace(getRoleHomeRoute(role));
    }
  }, [hasRouteAccess, isAuthHydrated, isAuthenticated, pathname, role, router, session?.user.forcePasswordChange]);

  if (!isAuthHydrated) {
    return null;
  }

  if (!isAuthenticated || !hasRouteAccess || session?.user.forcePasswordChange) {
    return null;
  }

  return <>{children}</>;
}
