"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { env } from "@/lib/env";
import { useAuthContext } from "@/providers/auth-provider";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type NotificationRealtimeContextValue = {
  connected: boolean;
};

const NotificationRealtimeContext = createContext<NotificationRealtimeContextValue | null>(null);

export function NotificationRealtimeProvider({ children }: { children: ReactNode }) {
  const { session, isAuthHydrated } = useAuthContext();
  const clientRef = useRef<Client | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(false);
  const connectedRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!isAuthHydrated) {
      return;
    }

    const accessToken = session?.tokens.accessToken;
    shouldReconnectRef.current = Boolean(accessToken);

    function dispatchUnreadCount(count: number, source: string) {
      if (typeof window === "undefined") {
        return;
      }

      window.dispatchEvent(new CustomEvent("notification-unread-changed", { detail: { count, source } }));
    }

    function dispatchReloadRequest(detail: unknown) {
      if (typeof window === "undefined") {
        return;
      }

      window.dispatchEvent(new CustomEvent("notification-reload-requested", { detail }));
    }

    function closeSocket() {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      } catch {}

      if (clientRef.current) {
        try {
          clientRef.current.deactivate();
        } catch {}
        clientRef.current = null;
      }

      connectedRef.current = false;
    }

    function connect() {
      if (!accessToken || !session?.user?.id) {
        closeSocket();
        return;
      }

      const apiUrl = new URL(env.apiBaseUrl);
      const sockUrl = `${apiUrl.protocol}//${apiUrl.host}/ws?token=${encodeURIComponent(accessToken)}`;

      const client = new Client({
        webSocketFactory: () => new SockJS(sockUrl) as any,
        reconnectDelay: 5000,
        onConnect: () => {
          connectedRef.current = true;
          try {
            const dest = `/topic/notifications/${session.user.id}`;
            subscriptionRef.current = client.subscribe(dest, (message) => {
              try {
                const payload = JSON.parse(message.body || '{}');

                if (typeof payload.unreadCount === 'number') {
                  dispatchUnreadCount(payload.unreadCount, payload.type ?? 'UNREAD_COUNT_UPDATED');
                }

                if (payload.type === 'NOTIFICATION_CREATED') {
                  dispatchReloadRequest(payload);
                }
              } catch {
                // ignore
              }
            });
          } catch (e) {
            // ignore
          }
        },
        onStompError: () => {
          connectedRef.current = false;
        },
        onDisconnect: () => {
          connectedRef.current = false;
        }
      });

      client.activate();
      clientRef.current = client;
    }

    closeSocket();
    connect();

    return () => {
      shouldReconnectRef.current = false;
      closeSocket();
    };
    // Intentionally re-run when auth session changes so the socket reconnects with the latest token.
  }, [isAuthHydrated, session?.tokens.accessToken]);

  return (
    <NotificationRealtimeContext.Provider value={{ connected: connectedRef.current }}>
      {children}
    </NotificationRealtimeContext.Provider>
  );
}

export function useNotificationRealtime() {
  const context = useContext(NotificationRealtimeContext);
  if (!context) {
    throw new Error("useNotificationRealtime must be used within NotificationRealtimeProvider.");
  }

  return context;
}