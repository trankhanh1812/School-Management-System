package com.school.school_management.dto.teacher;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherUpsertRequest {

    @NotBlank(message = "Teacher code is required")
    private String teacherCode;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String departmentCode;

    private Integer departmentLevel;

    private String phone;

    @Email(message = "Email should be valid")
    private String email;

    private String status;
}
