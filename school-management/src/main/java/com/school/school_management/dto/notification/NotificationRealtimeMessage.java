package com.school.school_management.dto.notification;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRealtimeMessage {

    private String type;
    private long unreadCount;
    private NotificationResponse notification;
    private OffsetDateTime occurredAt;
}