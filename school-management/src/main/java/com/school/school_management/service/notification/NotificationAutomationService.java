package com.school.school_management.service.notification;

import com.school.school_management.entity.User;
import java.util.Collection;

public interface NotificationAutomationService {

    void notifyUsers(Collection<User> recipients, String title, String message, String notificationType);

    void notifyRole(String roleCode, String title, String message, String notificationType);

    void notifyClassCodes(Collection<String> classCodes, String title, String message, String notificationType);
}