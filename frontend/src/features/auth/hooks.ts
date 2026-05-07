"use client";

import { useAuthSession } from "@/hooks/use-auth-session";

export function useAuthFeature() {
  return useAuthSession();
}
