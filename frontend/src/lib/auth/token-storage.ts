import type { AuthSession, AuthTokens } from "@/types/auth";
import { storageKeys } from "@/constants/storage-keys";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredTokens(): AuthTokens | null {
  if (!isBrowser()) {
    return null;
  }

  const accessToken =
    window.localStorage.getItem(storageKeys.accessToken) ??
    window.sessionStorage.getItem(storageKeys.accessToken);
  const refreshToken =
    window.localStorage.getItem(storageKeys.refreshToken) ??
    window.sessionStorage.getItem(storageKeys.refreshToken);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export function storeSession(session: AuthSession, persist = true) {
  if (!isBrowser()) {
    return;
  }

  const storage = persist ? window.localStorage : window.sessionStorage;
  const alternateStorage = persist
    ? window.sessionStorage
    : window.localStorage;

  alternateStorage.removeItem(storageKeys.accessToken);
  alternateStorage.removeItem(storageKeys.refreshToken);
  alternateStorage.removeItem(storageKeys.authSession);

  storage.setItem(storageKeys.accessToken, session.tokens.accessToken);
  storage.setItem(storageKeys.refreshToken, session.tokens.refreshToken);
  storage.setItem(storageKeys.authSession, JSON.stringify(session));
}

/**
 * Replaces just the access/refresh tokens after a silent refresh, keeping them in
 * whichever storage (local vs session) currently holds the session so the user's
 * "remember me" choice is preserved. Also patches the cached session JSON.
 */
export function updateStoredTokens(accessToken: string, refreshToken: string) {
  if (!isBrowser()) {
    return;
  }

  const storage =
    window.localStorage.getItem(storageKeys.accessToken) != null
      ? window.localStorage
      : window.sessionStorage;

  storage.setItem(storageKeys.accessToken, accessToken);
  storage.setItem(storageKeys.refreshToken, refreshToken);

  const raw = storage.getItem(storageKeys.authSession);
  if (raw) {
    try {
      const session = JSON.parse(raw) as AuthSession;
      session.tokens.accessToken = accessToken;
      session.tokens.refreshToken = refreshToken;
      storage.setItem(storageKeys.authSession, JSON.stringify(session));
    } catch {
      // Corrupt session JSON — leave it; getStoredSession() will clear it later.
    }
  }
}

export function getStoredSession(): AuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const raw =
    window.localStorage.getItem(storageKeys.authSession) ??
    window.sessionStorage.getItem(storageKeys.authSession);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(storageKeys.accessToken);
  window.localStorage.removeItem(storageKeys.refreshToken);
  window.localStorage.removeItem(storageKeys.authSession);
  window.sessionStorage.removeItem(storageKeys.accessToken);
  window.sessionStorage.removeItem(storageKeys.refreshToken);
  window.sessionStorage.removeItem(storageKeys.authSession);
}
