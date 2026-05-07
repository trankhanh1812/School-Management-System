package com.school.school_management.dto.student;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionHistoryResponse {

    private String studentCode;
    private String fullName;
    private List<PromotionRecord> records;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PromotionRecord {
        private String fromClassName;
        private String fromAcademicYear;
        private String toClassName;
        private String toAcademicYear;
        private String promotionResult; // PROMOTE, REPEAT, GRADUATING
        private OffsetDateTime promotedAt;
        private String promotedByName;
    }
}
