package com.school.school_management.dto.student;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentUpsertRequest {

    @NotBlank(message = "Student code is required")
    private String studentCode;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String dateOfBirth;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String academicYear;
    private String className;
    private String status;
    private String conduct;
}
