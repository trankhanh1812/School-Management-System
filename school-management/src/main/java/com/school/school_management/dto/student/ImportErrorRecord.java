package com.school.school_management.dto.student;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single import error
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportErrorRecord {
    @JsonProperty("row")
    private Integer row;

    @JsonProperty("error")
    private String error;

    @JsonProperty("student_code")
    private String studentCode;

    @JsonProperty("field")
    private String field;
}
