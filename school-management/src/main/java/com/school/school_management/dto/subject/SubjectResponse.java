package com.school.school_management.dto.subject;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectResponse {

    private String code;
    private String name;
    private String departmentCode;
    private String departmentName;
    private Short gradeLevel;
    private String status;
    private int assignmentCount;
}
