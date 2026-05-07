"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, pathname, router]);

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
