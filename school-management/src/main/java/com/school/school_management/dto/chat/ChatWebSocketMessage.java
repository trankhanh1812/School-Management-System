package com.school.school_management.dto.chat;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatWebSocketMessage {
    private String action;
    private UUID chatGroupId;
    private UUID messageId;
    private UUID senderId;
    private String senderName;
    private String messageText;
    private String mediaUrl;
    private String mediaType;
    private String fileName;
    private String messageType;
    private String timestamp;
}
