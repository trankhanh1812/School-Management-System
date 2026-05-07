package com.school.school_management.dto.attendance;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttendanceResponse {

    private String attendanceId;
    private String studentCode;
    private String studentName;
    private String sessionId;
    private String className;
    private String subjectCode;
    private String subjectName;
    private String teacherCode;
    private String teacherName;
    private OffsetDateTime sessionStartTime;
    private OffsetDateTime sessionEndTime;
    private String status;
    private String method;
    private String capturedByCode;
    private String capturedByName;
    private OffsetDateTime createdAt;
}
