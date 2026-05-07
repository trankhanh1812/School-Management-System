package com.school.school_management.dto.score;

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
public class ScoreResponse {

    private String scoreId;
    private String studentCode;
    private String studentName;
    private String examId;
    private String examTitle;
    private String examType;
    private String classCode;
    private String teacherCode;
    private String teacherName;
    private BigDecimal scoreValue;
    private String status;
    private OffsetDateTime publishedAt;
    private boolean editable;
    private List<ScoreHistoryResponse> history;
}
