"use client";

import { useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { env } from "@/lib/env";

export interface ChatWebSocketMessage {
  action: string;
  chatGroupId: string;
  messageId?: string;
  senderId: string;
  senderName: string;
  messageText?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  messageType?: string;
  timestamp: string;
}

export const useChatWebSocket = (token: string | null | undefined) => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Record<string, any>>({});
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatWebSocketMessage[]>([]);
  const listenersRef = useRef<Array<(msg: ChatWebSocketMessage) => void>>([]);

  useEffect(() => {
    if (!token) return;

    const apiUrl = new URL(env.apiBaseUrl);
    const sockUrl = `${apiUrl.protocol}//${apiUrl.host}/ws?token=${encodeURIComponent(token)}`;

    const client = new Client({
      connectHeaders: { token },
      debug: (str) => {
        // console.debug('STOMP:', str);
      },
      webSocketFactory: () => new SockJS(sockUrl) as any,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
        setConnected(false);
      },
      onDisconnect: () => {
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        Object.values(subscriptionsRef.current).forEach(
          (s: any) => s.unsubscribe && s.unsubscribe(),
        );
      } catch {}
      client.deactivate();
      clientRef.current = null;
      subscriptionsRef.current = {};
      setConnected(false);
    };
  }, [token]);

  const _handleIncoming = (payload: any) => {
    try {
      const body =
        typeof payload === "string"
          ? JSON.parse(payload)
          : JSON.parse(payload.body || "{}");
      const msg = body as ChatWebSocketMessage;
      setMessages((prev) => [...prev, msg]);
      listenersRef.current.forEach((l) => l(msg));
    } catch (e) {
      console.error("Failed to parse STOMP message", e);
    }
  };

  const subscribe = (listener: (msg: ChatWebSocketMessage) => void) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
  };

  const subscribeToGroup = (
    groupId: string,
    listener?: (msg: ChatWebSocketMessage) => void,
  ) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      return () => {};
    }

    const dest = `/topic/chat/${groupId}`;
    if (subscriptionsRef.current[dest]) {
      // already subscribed
      return () => {
        /* noop */
      };
    }

    const sub = client.subscribe(dest, (message: IMessage) => {
      _handleIncoming(message);
      if (listener) listener(JSON.parse(message.body));
    });

    subscriptionsRef.current[dest] = sub;

    return () => {
      try {
        sub.unsubscribe();
      } catch {}
      delete subscriptionsRef.current[dest];
    };
  };

  const unsubscribeFromGroup = (groupId: string) => {
    const dest = `/topic/chat/${groupId}`;
    const sub = subscriptionsRef.current[dest];
    if (sub) {
      try {
        sub.unsubscribe();
      } catch {}
      delete subscriptionsRef.current[dest];
    }
  };

  const send = (_message: ChatWebSocketMessage) => {
    // Message sending uses the REST API. STOMP send is intentionally a no-op to preserve server-side flow.
    return;
  };

  return {
    connected,
    send,
    subscribe,
    subscribeToGroup,
    unsubscribeFromGroup,
    messages,
  };
};
