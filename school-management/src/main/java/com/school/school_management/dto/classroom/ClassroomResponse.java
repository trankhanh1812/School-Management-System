package com.school.school_management.dto.classroom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomResponse {

    private String classCode;
    private String className;
    private String grade;
    private String academicYear;
    private String homeroomTeacher;
    private int totalStudents;
    private String room;
    private String shift;
    private String status;
    private String notes;
}
