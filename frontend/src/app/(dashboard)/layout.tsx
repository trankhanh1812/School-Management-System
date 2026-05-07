import type { ReactNode } from "react";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { FloatingChatButton } from "@/features/chat";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
      <FloatingChatButton />
    </ProtectedRoute>
  );
}
