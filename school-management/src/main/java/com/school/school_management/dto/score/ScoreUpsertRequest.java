package com.school.school_management.dto.score;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreUpsertRequest {

    @DecimalMin("0.0")
    @DecimalMax("10.0")
    private BigDecimal scoreValue;

    private String changeReason;
}
