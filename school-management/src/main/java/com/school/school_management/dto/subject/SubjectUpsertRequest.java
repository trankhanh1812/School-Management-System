package com.school.school_management.dto.subject;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectUpsertRequest {

    @NotBlank(message = "Subject code is required")
    private String code;

    @NotBlank(message = "Subject name is required")
    private String name;

    @NotBlank(message = "Department code is required")
    private String departmentCode;

    @Min(value = 1, message = "Grade level must be between 1 and 12")
    @Max(value = 12, message = "Grade level must be between 1 and 12")
    private Short gradeLevel;

    private String status;
}
