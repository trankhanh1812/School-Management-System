package com.school.school_management.dto.attendance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceUpsertRequest {

    @NotBlank(message = "Student code is required")
    private String studentCode;

    @NotBlank(message = "Session ID is required")
    private String sessionId;

    @NotBlank(message = "Status is required (PRESENT, ABSENT, LATE, EXCUSED)")
    private String status;

    @NotBlank(message = "Method is required (MANUAL or QR)")
    private String method;

    // For manual entry: teacher code who recorded attendance
    private String capturedByCode;
}
