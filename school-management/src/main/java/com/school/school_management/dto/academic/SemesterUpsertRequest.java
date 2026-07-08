package com.school.school_management.dto.academic;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to create or update a semester within an academic year. Identified by the pair
 * (academicYearCode, code); if that pair exists it is updated, otherwise created.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterUpsertRequest {

    @NotBlank(message = "Academic year code is required")
    private String academicYearCode;

    @NotBlank(message = "Semester code is required")
    private String code;

    /** ISO date, e.g. "2026-09-01". Optional. */
    private String startDate;

    /** ISO date, e.g. "2027-01-15". Optional. */
    private String endDate;

    /** ACTIVE / INACTIVE. Defaults to INACTIVE when blank. */
    private String status;

    /** Whether the semester is locked (no score/schedule edits). Defaults to false. */
    private Boolean isLocked;
}
