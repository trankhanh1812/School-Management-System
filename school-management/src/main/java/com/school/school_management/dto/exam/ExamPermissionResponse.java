package com.school.school_management.dto.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExamPermissionResponse {
    private String id;
    private String examId;
    private String examTitle;
    private String subjectName;
    private String examDate;
    private String studentCode;
    private String studentName;
    private Boolean isAllowed;
    private String reason;
    private String approvedByEmail;
    private String approvedByName;
}
