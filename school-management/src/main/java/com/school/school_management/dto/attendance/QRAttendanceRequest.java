package com.school.school_management.dto.attendance;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QRAttendanceRequest {

    @NotBlank(message = "QR code data is required")
    private String qrData;

    // Client will send their IP (backend will verify against allowed IPs)
    private String clientIp;

    @NotBlank(message = "Student code is required")
    private String studentCode;
}
