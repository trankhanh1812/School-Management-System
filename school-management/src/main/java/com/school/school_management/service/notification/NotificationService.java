package com.school.school_management.service.notification;

import com.school.school_management.dto.notification.NotificationCreateRequest;
import com.school.school_management.dto.notification.NotificationAudienceClassResponse;
import com.school.school_management.dto.notification.NotificationListResponse;
import com.school.school_management.dto.notification.NotificationResponse;
import java.util.List;

public interface NotificationService {

    NotificationListResponse listMine(Integer page, Integer size, String keyword, Boolean unreadOnly);

    NotificationResponse create(NotificationCreateRequest request);

    List<NotificationAudienceClassResponse> listAudienceClasses();

    long getUnreadCount();

    void markRead(String notificationId);

    void markAllRead();
}
