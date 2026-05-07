package com.school.school_management.dto.teacher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailableHomeroomTeacherResponse {

    private String teacherCode;
    private String fullName;
    private String department;
}
