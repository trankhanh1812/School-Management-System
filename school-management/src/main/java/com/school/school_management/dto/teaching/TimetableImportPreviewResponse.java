package com.school.school_management.dto.teaching;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimetableImportPreviewResponse {

    private String versionName;
    private String academicYearCode;
    private String semesterCode;
    private String effectiveFrom;
    private String effectiveTo;

    private Integer totalDetectedCells;
    private Integer validEntries;
    private Integer invalidEntries;

    @Builder.Default
    private List<TimetableGridUpsertRequest.TimetableEntry> entries = new ArrayList<>();

    @Builder.Default
    private List<ImportIssue> issues = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportIssue {
        private Integer row;
        private String column;
        private String classCode;
        private String subjectCode;
        private String message;
    }
}
