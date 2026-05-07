package com.school.school_management.dto.teaching;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TimetableVersionResponse {
    private String versionId;
    private String versionName;
    private Integer versionNo;
    private String status;
    private boolean active;
    private String semesterCode;
    private String academicYearCode;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private long entryCount;
}
