package com.school.school_management.dto.academic;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to create or update an academic year. Identified by its business {@code code}
 * (e.g. "2026-2027"); if a year with that code exists it is updated, otherwise created.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYearUpsertRequest {

    @NotBlank(message = "Academic year code is required")
    private String code;

    /** ISO date, e.g. "2026-09-01". Optional. */
    private String startDate;

    /** ISO date, e.g. "2027-05-31". Optional. */
    private String endDate;

    /** ACTIVE / INACTIVE. Defaults to INACTIVE when blank. */
    private String status;
}
