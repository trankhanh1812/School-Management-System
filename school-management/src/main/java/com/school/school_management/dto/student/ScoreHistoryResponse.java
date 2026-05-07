package com.school.school_management.dto.student;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreHistoryResponse {

    private String studentCode;

    private String fullName;

    private List<ScoreRecord> records;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreRecord {

        private String examTitle;

        private String subjectName;

        private String examType;

        private BigDecimal oldValue;

        private BigDecimal newValue;

        private String changeReason;

        private OffsetDateTime changedAt;

        private String changedByName;
    }
}
