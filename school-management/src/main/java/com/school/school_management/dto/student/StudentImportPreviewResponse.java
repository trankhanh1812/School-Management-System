package com.school.school_management.dto.student;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for student import preview
 * Shows parsed data before committing to database
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportPreviewResponse {
    @JsonProperty("import_id")
    private String importId;

    @JsonProperty("total_records")
    private Integer totalRecords;

    @JsonProperty("valid_records")
    private Integer validRecords;

    @JsonProperty("invalid_records")
    private Integer invalidRecords;

    @JsonProperty("students")
    private List<StudentPreviewItem> students = new ArrayList<>();

    @JsonProperty("parents")
    private List<ParentPreviewItem> parents = new ArrayList<>();

    @JsonProperty("errors")
    private List<ImportErrorRecord> errors = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentPreviewItem {
        @JsonProperty("row_number")
        private Integer rowNumber;

        @JsonProperty("student_code")
        private String studentCode;

        @JsonProperty("full_name")
        private String fullName;

        @JsonProperty("date_of_birth")
        private String dateOfBirth;

        @JsonProperty("gender")
        private String gender;

        @JsonProperty("phone")
        private String phone;

        @JsonProperty("email")
        private String email;

        @JsonProperty("address")
        private String address;

        @JsonProperty("class_name")
        private String className;

        @JsonProperty("academic_year")
        private String academicYear;

        @JsonProperty("status")
        private String status;

        @JsonProperty("enrollment_date")
        private String enrollmentDate;

        @JsonProperty("has_errors")
        private Boolean hasErrors;

        @JsonProperty("errors")
        private List<String> fieldErrors = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParentPreviewItem {
        @JsonProperty("row_number")
        private Integer rowNumber;

        @JsonProperty("student_code")
        private String studentCode;

        @JsonProperty("parent_name")
        private String parentName;

        @JsonProperty("parent_phone")
        private String parentPhone;

        @JsonProperty("parent_email")
        private String parentEmail;

        @JsonProperty("relation")
        private String relation;

        @JsonProperty("is_primary")
        private String isPrimary;

        @JsonProperty("has_errors")
        private Boolean hasErrors;

        @JsonProperty("errors")
        private List<String> fieldErrors = new ArrayList<>();
    }
}
