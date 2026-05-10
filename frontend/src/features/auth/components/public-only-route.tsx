"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, session } = useAuthSession();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Nếu cần đổi mật khẩu lần đầu → chỉ cho phép ở trang đó
    if (session?.user.forcePasswordChange) {
      if (pathname !== "/change-password-first-login") {
        router.replace("/change-password-first-login");
      }
      return;
    }

    // Đã đăng nhập bình thường → ra khỏi public route
    if (pathname !== "/change-password-first-login") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, pathname, router, session?.user.forcePasswordChange]);

  // Cho phép render trang change-password-first-login dù đã đăng nhập
  if (isAuthenticated && pathname !== "/change-password-first-login") {
    return null;
  }

  return <>{children}</>;
}
