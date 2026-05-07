package com.school.school_management.repository;

import com.school.school_management.entity.ChatMessage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends BaseRepository<ChatMessage, UUID> {

    Optional<ChatMessage> findByIdAndDeletedAtIsNull(UUID id);

    List<ChatMessage> findByChatGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID chatGroupId);

    Page<ChatMessage> findByChatGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID chatGroupId, Pageable pageable);

    List<ChatMessage> findBySenderIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID senderId);

    Page<ChatMessage> findByChatGroupIdAndMessageTextContainingIgnoreCaseAndDeletedAtIsNullOrderByCreatedAtDesc(
        UUID chatGroupId, String messageText, Pageable pageable
    );

    Page<ChatMessage> findByChatGroupIdAndFileNameContainingIgnoreCaseAndDeletedAtIsNullOrderByCreatedAtDesc(
        UUID chatGroupId, String fileName, Pageable pageable
    );

    long countByChatGroupIdAndDeletedAtIsNull(UUID chatGroupId);

    void deleteByChatGroupId(UUID chatGroupId);
}
