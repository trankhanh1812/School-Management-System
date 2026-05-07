package com.school.school_management.dto.classroom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassStudentResponse {

    private String studentCode;
    private String fullName;
    private String conduct;
    private String scoreAverage;
    private String status;
}
