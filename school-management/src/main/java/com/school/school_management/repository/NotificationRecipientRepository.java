package com.school.school_management.repository;

import com.school.school_management.entity.NotificationRecipient;
import com.school.school_management.entity.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRecipientRepository extends BaseRepository<NotificationRecipient, UUID> {

    @Query("""
        select nr
        from NotificationRecipient nr
        join fetch nr.notification n
        where nr.user = :user
          and n.deletedAt is null
        order by coalesce(n.sentAt, n.createdAt) desc
        """)
    List<NotificationRecipient> findInboxByUser(@Param("user") User user);

    @Query("""
        select nr
        from NotificationRecipient nr
        join fetch nr.notification n
        where nr.user = :user
          and n.id = :notificationId
          and n.deletedAt is null
        """)
    Optional<NotificationRecipient> findByUserAndNotificationId(
        @Param("user") User user,
        @Param("notificationId") UUID notificationId);

    @Query("""
        select count(nr)
        from NotificationRecipient nr
        join nr.notification n
        where nr.user = :user
          and nr.readAt is null
          and n.deletedAt is null
        """)
    long countUnreadByUser(@Param("user") User user);
}
