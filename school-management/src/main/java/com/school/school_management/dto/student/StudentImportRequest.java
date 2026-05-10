package com.school.school_management.dto.student;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for importing a single student from Excel
 * Maps to STUDENT sheet in Excel template
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportRequest {
    @JsonProperty("student_code")
    private String studentCode;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("date_of_birth")
    private String dateOfBirth; // YYYY-MM-DD format

    @JsonProperty("gender")
    private String gender; // Male / Female

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("email")
    private String email;

    @JsonProperty("address")
    private String address;

    @JsonProperty("class_name")
    private String className;

    @JsonProperty("academic_year")
    private String academicYear; // e.g., 2024-2025

    @JsonProperty("status")
    private String status; // studying / transferred / dropout

    @JsonProperty("enrollment_date")
    private String enrollmentDate; // YYYY-MM-DD format

    @JsonProperty("national_id")
    private String nationalId; // CCCD / CMND

    // Row number for error tracking
    private Integer rowNumber;
}
