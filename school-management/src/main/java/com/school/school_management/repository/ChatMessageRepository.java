package com.school.school_management.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.school.school_management.entity.ChatMessage;

@Repository
public interface ChatMessageRepository extends BaseRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m WHERE m.chatGroup.id = :groupId AND m.deletedAt IS NULL "
        + "AND (LOWER(m.messageText) LIKE LOWER(CONCAT('%', :keyword, '%')) "
        + "OR LOWER(m.fileName) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
        + "ORDER BY m.createdAt DESC")
    Page<ChatMessage> searchInGroup(
        @Param("groupId") UUID groupId, @Param("keyword") String keyword, Pageable pageable);

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
