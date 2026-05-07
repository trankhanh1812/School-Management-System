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
public class ChatGroupResponse {
    private UUID id;
    private String groupName;
    private String groupType;
    private String description;
    private String scope;
    private UUID createdBy;
    private String classCode;
    private String subjectCode;
    private String departmentCode;
    private Boolean isArchived;
    private Long memberCount;
    private Long messageCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
