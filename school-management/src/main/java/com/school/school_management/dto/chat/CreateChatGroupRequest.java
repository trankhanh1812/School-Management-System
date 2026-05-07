package com.school.school_management.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatGroupRequest {
    private String groupName;
    private String groupType;
    private String description;
    private String scope;
    private String classId;
    private String subjectId;
    private String departmentId;
}
