package com.school.school_management.repository;

import com.school.school_management.entity.ChatMessageRead;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageReadRepository extends BaseRepository<ChatMessageRead, UUID> {

    Optional<ChatMessageRead> findByMessageIdAndUserId(UUID messageId, UUID userId);

    List<ChatMessageRead> findByMessageId(UUID messageId);

    List<ChatMessageRead> findByUserIdOrderByReadAtDesc(UUID userId);

    long countByMessageIdAndReadAtIsNull(UUID messageId);

    void deleteByMessageId(UUID messageId);

    void deleteByMessageIdAndUserId(UUID messageId, UUID userId);

    boolean existsByMessageIdAndUserId(UUID messageId, UUID userId);
}
