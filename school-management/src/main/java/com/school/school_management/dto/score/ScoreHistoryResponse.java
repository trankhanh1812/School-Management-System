package com.school.school_management.dto.score;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreHistoryResponse {

    private BigDecimal oldValue;
    private BigDecimal newValue;
    private String changedBy;
    private String changeReason;
    private OffsetDateTime changedAt;
}
