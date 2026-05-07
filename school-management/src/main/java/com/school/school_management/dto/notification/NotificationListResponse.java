package com.school.school_management.dto.notification;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationListResponse {

    private List<NotificationResponse> items;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private long unreadCount;
}
