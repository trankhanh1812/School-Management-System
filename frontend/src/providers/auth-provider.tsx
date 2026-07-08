"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession } from "@/types/auth";
import {
  destroyAuthSession,
  readAuthSession,
  saveAuthSession,
} from "@/lib/auth/auth-session";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAuthHydrated: boolean;
  signIn: (session: AuthSession, persist?: boolean) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);

  useEffect(() => {
    setSession(readAuthSession());
    setIsAuthHydrated(true);
  }, []);

  // When the api-client silently refreshes the tokens (on a 401), sync the new
  // tokens into the in-memory session so token-dependent consumers — notably the
  // notification WebSocket — reconnect with the fresh token instead of dying.
  useEffect(() => {
    function handleTokensRefreshed(event: Event) {
      const detail = (event as CustomEvent).detail as
        | { accessToken?: string; refreshToken?: string }
        | undefined;
      if (!detail?.accessToken) {
        return;
      }

      setSession((previous) =>
        previous
          ? {
              ...previous,
              tokens: {
                ...previous.tokens,
                accessToken: detail.accessToken!,
                refreshToken:
                  detail.refreshToken ?? previous.tokens.refreshToken,
              },
            }
          : previous,
      );
    }

    window.addEventListener("auth-tokens-refreshed", handleTokensRefreshed);
    return () =>
      window.removeEventListener(
        "auth-tokens-refreshed",
        handleTokensRefreshed,
      );
  }, []);

  const signIn = useCallback((nextSession: AuthSession, persist = true) => {
    saveAuthSession(nextSession, persist);
    setSession(nextSession);
  }, []);

  const signOut = useCallback(() => {
    destroyAuthSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isAuthHydrated,
      signIn,
      signOut,
    }),
    [isAuthHydrated, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider.");
  }

  return context;
}
