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
public class ChatGroupMemberResponse {
    private UUID id;
    private UUID chatGroupId;
    private UUID userId;
    private String userName;
    private String fullName;
    private OffsetDateTime joinedAt;
}
