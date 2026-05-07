"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { NotificationRealtimeProvider } from "@/providers/notification-realtime-provider";
import { ToastProvider } from "@/shared/components/toast-provider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationRealtimeProvider>
        <ToastProvider>{children}</ToastProvider>
      </NotificationRealtimeProvider>
    </AuthProvider>
  );
}
