package com.school.school_management.dto.teaching;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachingAssignmentResponse {

    private String assignmentId;
    private String teacherCode;
    private String teacherName;
    private String classCode;
    private String className;
    private String subjectCode;
    private String subjectName;
    private String semesterCode;
    private String academicYearCode;
    private boolean homeroom;
    private String note;
    private List<TeachingScheduleDetail> scheduleData;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeachingScheduleDetail {
        private int day;        // 1-6 (Mon-Sat)
        private int period;     // 1-5
        private String shift;   // "morning" or "afternoon"
        private String classCode;
    }
}
