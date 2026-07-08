package com.school.school_management.service.chat;

import com.school.school_management.dto.chat.ChatMessageResponse;
import com.school.school_management.dto.chat.SendMessageRequest;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ChatMessageService {

    ChatMessageResponse sendMessage(UUID groupId, UUID senderId, SendMessageRequest request);

    ChatMessageResponse getMessageById(UUID messageId, UUID currentUserId);

    Page<ChatMessageResponse> getGroupMessages(UUID groupId, UUID currentUserId, Pageable pageable);

    Page<ChatMessageResponse> searchMessages(UUID groupId, String keyword, UUID currentUserId, Pageable pageable);

    void markMessageAsRead(UUID messageId, UUID userId);

    void markGroupMessagesAsRead(UUID groupId, UUID userId);

    long getUnreadMessageCount(UUID groupId, UUID userId);

    void deleteMessage(UUID messageId, UUID userId);

    ChatMessageResponse updateMessage(UUID messageId, UUID userId, SendMessageRequest request);
}
