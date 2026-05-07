package com.school.school_management.dto.classroom;

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
public class PromotionImportPreviewResponse {

    private UUID importId;
    private Integer totalRecords;
    private Integer validRecords;
    private Integer invalidRecords;

    @Builder.Default
    private List<PromotionImportPreviewItem> rows = new ArrayList<>();

    @Builder.Default
    private List<String> issues = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromotionImportPreviewItem {
        private Integer rowNumber;
        private String studentCode;
        private String studentName;
        private String currentClass;
        private String currentAcademicYear;
        private String proposedClass;
        private String nextAcademicYear;
        private String action;
        private String note;
        private Boolean hasErrors;

        @Builder.Default
        private List<String> errors = new ArrayList<>();
    }
}