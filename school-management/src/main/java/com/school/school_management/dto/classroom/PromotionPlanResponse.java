package com.school.school_management.dto.classroom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionPlanResponse {

    private String studentCode;
    private String studentName;
    private String currentClass;
    private String nextAcademicYear;
    private String proposedClass;
    private String action;
    private String reason;
    private String status;
}
