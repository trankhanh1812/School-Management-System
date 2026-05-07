package com.school.school_management.dto.classroom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomMetricResponse {

    private String label;
    private String value;
    private String trend;
    private String note;
}
