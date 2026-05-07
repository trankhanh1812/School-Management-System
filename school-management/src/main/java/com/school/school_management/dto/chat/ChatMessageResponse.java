package com.school.school_management.dto.chat;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private UUID id;
    private UUID chatGroupId;
    private UUID senderId;
    private String senderName;
    private String messageText;
    private String mediaUrl;
    private String mediaType;
    private String fileName;
    private String messageType;
    private Long readCount;
    private Boolean isReadByCurrentUser;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
