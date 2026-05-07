package com.school.school_management.dto.teaching;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TimetableEntryResponse {
    private String classCode;
    private String subjectCode;
    private Short dayOfWeek;
    private Short periodStart;
    private Short periodEnd;
}
