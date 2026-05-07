package com.school.school_management.service.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.school_management.dto.notification.NotificationRealtimeMessage;
import com.school.school_management.dto.notification.NotificationResponse;
import com.school.school_management.entity.User;
import com.school.school_management.websocket.notification.NotificationWebSocketSessionRegistry;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationRealtimeServiceImpl implements NotificationRealtimeService {

    private final NotificationWebSocketSessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationRealtimeServiceImpl(
            NotificationWebSocketSessionRegistry sessionRegistry,
            ObjectMapper objectMapper,
            SimpMessagingTemplate messagingTemplate) {
        this.sessionRegistry = sessionRegistry;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void broadcastNotificationCreated(Collection<User> recipients, NotificationResponse notification) {
        Set<UUID> userIds = new LinkedHashSet<>();
        for (User recipient : recipients) {
            if (recipient != null && recipient.getId() != null) {
                userIds.add(recipient.getId());
            }
        }

        NotificationRealtimeMessage message = NotificationRealtimeMessage.builder()
            .type("NOTIFICATION_CREATED")
            .notification(notification)
            .occurredAt(OffsetDateTime.now())
            .build();

        sendToUsers(userIds, message);
    }

    @Override
    public void broadcastUnreadCount(User user, long unreadCount) {
        if (user == null || user.getId() == null) {
            return;
        }

        NotificationRealtimeMessage message = NotificationRealtimeMessage.builder()
            .type("UNREAD_COUNT_UPDATED")
            .unreadCount(unreadCount)
            .occurredAt(OffsetDateTime.now())
            .build();

        sendToUsers(Set.of(user.getId()), message);
    }

    private void sendToUsers(Collection<UUID> userIds, NotificationRealtimeMessage message) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize notification realtime payload", exception);
        }

        for (UUID userId : userIds) {
            sessionRegistry.broadcast(userId, payload);
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, message);
        }
    }
}