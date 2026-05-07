package com.school.school_management.dto.student;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for importing a single parent from Excel
 * Maps to parent sheet in Excel template
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParentImportRequest {
    @JsonProperty("student_code")
    private String studentCode; // Reference to student

    @JsonProperty("parent_name")
    private String parentName;

    @JsonProperty("parent_phone")
    private String parentPhone;

    @JsonProperty("parent_email")
    private String parentEmail;

    @JsonProperty("relation")
    private String relation; // father / mother / guardian

    @JsonProperty("is_primary")
    private String isPrimary; // true / false - whether this is the primary guardian

    // Row number for error tracking
    private Integer rowNumber;
}
