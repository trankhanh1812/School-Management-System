"use client";

import { useAuthContext } from "@/providers/auth-provider";

export function useAuthSession() {
  return useAuthContext();
}
