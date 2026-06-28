package com.school.school_management.dto.exam;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamPermissionUpsertRequest {

    @NotBlank(message = "Exam ID is required")
    private String examId;

    @NotBlank(message = "Student code is required")
    private String studentCode;

    @NotNull(message = "isAllowed is required")
    private Boolean isAllowed;

    private String reason;
}
