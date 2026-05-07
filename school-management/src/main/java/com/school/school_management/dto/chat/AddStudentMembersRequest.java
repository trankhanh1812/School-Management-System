package com.school.school_management.dto.chat;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddStudentMembersRequest {
    private List<String> studentCodes;
    private String classCode;
}
