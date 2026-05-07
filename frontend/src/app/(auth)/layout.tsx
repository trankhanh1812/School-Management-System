import type { ReactNode } from "react";
import { PublicOnlyRoute } from "@/features/auth/components/public-only-route";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <PublicOnlyRoute>
      <main className="min-h-screen">{children}</main>
    </PublicOnlyRoute>
  );
}
