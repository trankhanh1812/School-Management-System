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
public class NotificationResponse {

    private String notificationId;
    private String title;
    private String message;
    private String notificationType;
    private String channel;
    private OffsetDateTime sentAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime readAt;
    private boolean read;
}
