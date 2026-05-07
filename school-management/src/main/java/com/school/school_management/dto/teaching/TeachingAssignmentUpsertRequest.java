package com.school.school_management.dto.teaching;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachingAssignmentUpsertRequest {

    @NotBlank(message = "Teacher code is required")
    private String teacherCode;

    @NotBlank(message = "Class code is required")
    private String classCode;

    @NotBlank(message = "Subject code is required")
    private String subjectCode;

    @NotBlank(message = "Semester code is required")
    private String semesterCode;

    @NotBlank(message = "Academic year code is required")
    private String academicYearCode;

    private Boolean isHomeroom;

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
