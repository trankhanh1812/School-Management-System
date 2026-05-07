package com.school.school_management.service.notification.events;

import com.school.school_management.entity.User;
import com.school.school_management.repository.NotificationRecipientRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.notification.NotificationRealtimeService;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class NotificationRealtimeEventListener {

    private final NotificationRealtimeService notificationRealtimeService;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserRepository userRepository;

    public NotificationRealtimeEventListener(
            NotificationRealtimeService notificationRealtimeService,
            NotificationRecipientRepository notificationRecipientRepository,
            UserRepository userRepository) {
        this.notificationRealtimeService = notificationRealtimeService;
        this.notificationRecipientRepository = notificationRecipientRepository;
        this.userRepository = userRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotificationCreated(NotificationCreatedEvent event) {
        List<User> recipients = event.recipientIds().stream()
            .map(userRepository::findById)
            .flatMap(java.util.Optional::stream)
            .filter(user -> user.getDeletedAt() == null)
            .toList();

        if (recipients.isEmpty()) {
            return;
        }

        notificationRealtimeService.broadcastNotificationCreated(recipients, event.notification());
        for (User recipient : recipients) {
            notificationRealtimeService.broadcastUnreadCount(
                recipient,
                notificationRecipientRepository.countUnreadByUser(recipient)
            );
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleUnreadCountChanged(NotificationUnreadCountChangedEvent event) {
        if (event.userId() == null) {
            return;
        }

        userRepository.findById(event.userId())
            .filter(user -> user.getDeletedAt() == null)
            .ifPresent(user -> notificationRealtimeService.broadcastUnreadCount(user, event.unreadCount()));
    }
}