package com.school.school_management.dto.teacher;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherResponse {

    private String id;
    private String teacherCode;
    private String fullName;
    private String department;
    private Integer departmentLevel;
    private String title;
    private String phone;
    private String email;
    private String homeroomClass;
    private List<String> subjects;
    private String employmentStatus;
    private String bio;
    private List<TeacherAssignmentResponse> assignments;
}
