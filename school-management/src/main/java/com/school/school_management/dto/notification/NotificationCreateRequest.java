package com.school.school_management.dto.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Notification type is required")
    private String notificationType;

    @NotBlank(message = "Channel is required")
    @Size(max = 30, message = "Channel must not exceed 30 characters")
    private String channel;

    @NotBlank(message = "Audience is required")
    private String audience;

    private List<String> classCodes;
}
