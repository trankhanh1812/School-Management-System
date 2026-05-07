package com.school.school_management.dto.teacher;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherDepartmentResponse {

    private String id;
    private String name;
    private String headTeacher;
    private String viceHeadTeacher;
    private int teacherCount;
    private int subjectCount;
}
