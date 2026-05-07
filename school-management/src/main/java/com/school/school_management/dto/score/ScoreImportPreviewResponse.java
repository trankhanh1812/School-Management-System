package com.school.school_management.dto.score;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreImportPreviewResponse {

    private UUID importId;
    private Integer totalRecords;
    private Integer validRecords;
    private Integer invalidRecords;

    @Builder.Default
    private List<ScoreImportPreviewItem> rows = new ArrayList<>();

    @Builder.Default
    private List<String> issues = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreImportPreviewItem {
        private Integer rowNumber;
        private String examTitle;
        private String classCode;
        private String studentCode;
        private String subjectCode;
        private BigDecimal scoreValue;
        private String note;
        private Boolean absentFlag;
        private Boolean hasErrors;

        @Builder.Default
        private List<String> errors = new ArrayList<>();
    }
}