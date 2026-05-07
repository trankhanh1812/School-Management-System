package com.school.school_management.websocket.notification;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Component
public class NotificationWebSocketSessionRegistry {

    private final ConcurrentHashMap<UUID, Set<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UUID> userIdBySessionId = new ConcurrentHashMap<>();

    public void register(UUID userId, WebSocketSession session) {
        sessionsByUserId.computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet()).add(session);
        userIdBySessionId.put(session.getId(), userId);
    }

    public void unregister(WebSocketSession session) {
        UUID userId = userIdBySessionId.remove(session.getId());
        if (userId == null) {
            return;
        }

        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                sessionsByUserId.remove(userId, sessions);
            }
        }
    }

    public void broadcast(UUID userId, String payload) {
        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        for (WebSocketSession session : sessions) {
            if (session == null || !session.isOpen()) {
                unregister(session);
                continue;
            }

            try {
                session.sendMessage(new TextMessage(payload));
            } catch (IOException exception) {
                unregister(session);
            }
        }
    }
}