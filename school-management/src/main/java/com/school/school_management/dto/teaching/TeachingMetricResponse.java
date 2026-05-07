package com.school.school_management.dto.teaching;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachingMetricResponse {

    private String label;
    private String value;
    private String trend;
    private String note;
}
