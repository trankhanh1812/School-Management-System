package com.school.school_management.dto.conduct;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConductResponse {

    private String id;

    private String studentCode;

    private String studentName;

    private String semesterCode;

    private String academicYearCode;

    private String classCode;

    private String className;

    private String conductLevel;

    private String remarks;

    private String assessedByTeacherCode;

    private String assessedByName;
}
