package com.school.school_management.service.notification.events;

import com.school.school_management.dto.notification.NotificationResponse;
import java.util.List;
import java.util.UUID;

public record NotificationCreatedEvent(List<UUID> recipientIds, NotificationResponse notification) {
}