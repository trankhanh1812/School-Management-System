package com.school.school_management.service.notification.events;

import java.util.UUID;

public record NotificationUnreadCountChangedEvent(UUID userId, long unreadCount) {
}