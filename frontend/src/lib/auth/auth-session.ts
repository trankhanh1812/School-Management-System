import type { AuthSession } from "@/types/auth";
import { clearStoredSession, getStoredSession, storeSession } from "@/lib/auth/token-storage";

export function readAuthSession() {
  return getStoredSession();
}

export function saveAuthSession(session: AuthSession, persist = true) {
  storeSession(session, persist);
}

export function destroyAuthSession() {
  clearStoredSession();
}
