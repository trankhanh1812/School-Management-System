package com.school.school_management.repository;

import com.school.school_management.entity.Notification;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends BaseRepository<Notification, UUID> {

    Optional<Notification> findByIdAndDeletedAtIsNull(UUID id);

    long countByDeletedAtIsNull();
}
