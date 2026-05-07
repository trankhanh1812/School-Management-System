package com.school.school_management.service.notification;

import com.school.school_management.dto.notification.NotificationResponse;
import com.school.school_management.entity.User;
import java.util.Collection;

public interface NotificationRealtimeService {

    void broadcastNotificationCreated(Collection<User> recipients, NotificationResponse notification);

    void broadcastUnreadCount(User user, long unreadCount);
}