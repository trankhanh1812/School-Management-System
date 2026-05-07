package com.school.school_management.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    private String messageText;
    private String mediaUrl;
    private String mediaType;
    private String fileName;
    private String messageType;
}
