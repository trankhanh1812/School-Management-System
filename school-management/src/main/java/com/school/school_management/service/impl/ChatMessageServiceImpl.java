package com.school.school_management.service.impl;

import com.school.school_management.dto.chat.ChatMessageResponse;
import com.school.school_management.dto.chat.ChatWebSocketMessage;
import com.school.school_management.dto.chat.SendMessageRequest;
import com.school.school_management.entity.ChatGroup;
import com.school.school_management.entity.ChatMessage;
import com.school.school_management.entity.ChatMessageRead;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.exception.ResourceNotFoundException;
import com.school.school_management.repository.ChatGroupMemberRepository;
import com.school.school_management.repository.ChatGroupRepository;
import com.school.school_management.repository.ChatMessageReadRepository;
import com.school.school_management.repository.ChatMessageRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.chat.ChatMessageService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageReadRepository chatMessageReadRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessageServiceImpl(
        ChatMessageRepository chatMessageRepository,
        ChatMessageReadRepository chatMessageReadRepository,
        ChatGroupRepository chatGroupRepository,
        ChatGroupMemberRepository chatGroupMemberRepository,
        UserRepository userRepository,
        SimpMessagingTemplate messagingTemplate
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatMessageReadRepository = chatMessageReadRepository;
        this.chatGroupRepository = chatGroupRepository;
        this.chatGroupMemberRepository = chatGroupMemberRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public ChatMessageResponse sendMessage(UUID groupId, UUID senderId, SendMessageRequest request) {
        ChatGroup group = chatGroupRepository
            .findByIdAndDeletedAtIsNull(groupId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat group not found"));

        User sender = userRepository
            .findByIdAndDeletedAtIsNull(senderId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Ensure sender is a member of the group
        boolean isMember = chatGroupMemberRepository.existsByChatGroupIdAndUserId(groupId, senderId);
        if (!isMember) {
            throw new CustomException("You are not a member of this chat group", 403);
        }

        ChatMessage message = ChatMessage.builder()
            .chatGroup(group)
            .sender(sender)
            .messageText(request.getMessageText())
            .mediaUrl(request.getMediaUrl())
            .mediaType(request.getMediaType())
            .fileName(request.getFileName())
            .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
            .createdAt(OffsetDateTime.now())
            .build();

        try {
            ChatMessage savedMessage = chatMessageRepository.save(message);
            ChatMessageResponse response = mapToResponse(savedMessage, senderId);
            publishGroupEvent(savedMessage.getChatGroup().getId(), "send_message", response, sender);
            return response;
        } catch (Exception ex) {
            throw new CustomException("Failed to send message: " + ex.getMessage(), 500);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ChatMessageResponse getMessageById(UUID messageId) {
        ChatMessage message = chatMessageRepository
            .findByIdAndDeletedAtIsNull(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat message not found"));
        return mapToResponse(message, message.getSender().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getGroupMessages(UUID groupId, UUID currentUserId, Pageable pageable) {
        return chatMessageRepository
            .findByChatGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId, pageable)
            .map(message -> mapToResponse(message, currentUserId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> searchMessages(UUID groupId, String keyword, UUID currentUserId, Pageable pageable) {
        // Search in message text first
        Page<ChatMessage> messagesFromText = chatMessageRepository
            .findByChatGroupIdAndMessageTextContainingIgnoreCaseAndDeletedAtIsNullOrderByCreatedAtDesc(
                groupId, keyword, pageable
            );

        // If no results, search in file names
        if (messagesFromText.getContent().isEmpty()) {
            messagesFromText = chatMessageRepository
                .findByChatGroupIdAndFileNameContainingIgnoreCaseAndDeletedAtIsNullOrderByCreatedAtDesc(
                    groupId, keyword, pageable
                );
        }

        return messagesFromText.map(message -> mapToResponse(message, currentUserId));
    }

    @Override
    public void markMessageAsRead(UUID messageId, UUID userId) {
        ChatMessage message = chatMessageRepository
            .findByIdAndDeletedAtIsNull(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat message not found"));

        User user = userRepository
            .findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!chatMessageReadRepository.existsByMessageIdAndUserId(messageId, userId)) {
            ChatMessageRead read = ChatMessageRead.builder()
                .message(message)
                .user(user)
                .readAt(OffsetDateTime.now())
                .build();
            chatMessageReadRepository.save(read);
            ChatMessageResponse response = mapToResponse(message, userId);
            publishGroupEvent(message.getChatGroup().getId(), "message_read", response, user);
        }
    }

    @Override
    public void markGroupMessagesAsRead(UUID groupId, UUID userId) {
        List<ChatMessage> messages = chatMessageRepository
            .findByChatGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);

        for (ChatMessage message : messages) {
            if (!chatMessageReadRepository.existsByMessageIdAndUserId(message.getId(), userId)) {
                ChatMessageRead read = ChatMessageRead.builder()
                    .message(message)
                    .user(userRepository.findByIdAndDeletedAtIsNull(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found")))
                    .readAt(OffsetDateTime.now())
                    .build();
                chatMessageReadRepository.save(read);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadMessageCount(UUID groupId, UUID userId) {
        List<ChatMessage> messages = chatMessageRepository
            .findByChatGroupIdAndDeletedAtIsNullOrderByCreatedAtDesc(groupId);

        return messages.stream()
            .filter(msg -> !msg.getSender().getId().equals(userId))
            .filter(msg -> !chatMessageReadRepository.existsByMessageIdAndUserId(msg.getId(), userId))
            .count();
    }

    @Override
    public void deleteMessage(UUID messageId, UUID userId) {
        ChatMessage message = chatMessageRepository
            .findByIdAndDeletedAtIsNull(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat message not found"));

        // Only allow sender or admin to delete
        if (!message.getSender().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own messages");
        }

        message.setDeletedAt(OffsetDateTime.now());
        message.setDeletedBy(userId);
        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageResponse response = mapToResponse(saved, userId);
        publishGroupEvent(saved.getChatGroup().getId(), "delete_message", response, message.getSender());
    }

    @Override
    public ChatMessageResponse updateMessage(UUID messageId, UUID userId, SendMessageRequest request) {
        ChatMessage message = chatMessageRepository
            .findByIdAndDeletedAtIsNull(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat message not found"));

        // Only allow sender to update
        if (!message.getSender().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own messages");
        }

        if (request.getMessageText() != null) {
            message.setMessageText(request.getMessageText());
        }
        message.setUpdatedAt(OffsetDateTime.now());

        ChatMessage updatedMessage = chatMessageRepository.save(message);
        ChatMessageResponse response = mapToResponse(updatedMessage, userId);
        publishGroupEvent(updatedMessage.getChatGroup().getId(), "update_message", response, message.getSender());
        return response;
    }

    private void publishGroupEvent(UUID groupId, String action, ChatMessageResponse message, User actor) {
        if (groupId == null || message == null) {
            return;
        }

        ChatWebSocketMessage payload = ChatWebSocketMessage.builder()
            .action(action)
            .chatGroupId(groupId)
            .messageId(message.getId())
            .senderId(actor != null ? actor.getId() : null)
            .senderName(actor != null ? actor.getFullName() : null)
            .messageText(message.getMessageText())
            .mediaUrl(message.getMediaUrl())
            .mediaType(message.getMediaType())
            .fileName(message.getFileName())
            .messageType(message.getMessageType())
            .timestamp(OffsetDateTime.now().toString())
            .build();

        messagingTemplate.convertAndSend("/topic/chat/" + groupId, payload);
    }

    private ChatMessageResponse mapToResponse(ChatMessage message, UUID currentUserId) {
        Set<ChatMessageRead> readBySet = message.getReadBy();
        if (readBySet == null) {
            readBySet = new java.util.HashSet<>();
        }
        
        long readCount = readBySet.size();
        boolean isReadByCurrentUser = readBySet.stream()
            .anyMatch(read -> read.getUser().getId().equals(currentUserId));

        return ChatMessageResponse.builder()
            .id(message.getId())
            .chatGroupId(message.getChatGroup().getId())
            .senderId(message.getSender().getId())
            .senderName(message.getSender().getFullName())
            .messageText(message.getMessageText())
            .mediaUrl(message.getMediaUrl())
            .mediaType(message.getMediaType())
            .fileName(message.getFileName())
            .messageType(message.getMessageType())
            .readCount(readCount)
            .isReadByCurrentUser(isReadByCurrentUser)
            .createdAt(message.getCreatedAt())
            .updatedAt(message.getUpdatedAt())
            .build();
    }
}
