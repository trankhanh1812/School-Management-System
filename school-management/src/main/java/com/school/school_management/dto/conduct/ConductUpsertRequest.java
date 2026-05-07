package com.school.school_management.dto.conduct;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConductUpsertRequest {

    @NotBlank(message = "Student code is required")
    private String studentCode;

    @NotBlank(message = "Semester code is required")
    private String semesterCode;

    @NotBlank(message = "Class code is required")
    private String classCode;

    @NotBlank(message = "Conduct level is required")
    private String conductLevel;

    private String remarks;

    @NotBlank(message = "Teacher code is required")
    private String assessedByTeacherCode;
}
