package com.school.school_management.dto.attendance;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for the deep-link QR confirm endpoint.
 * Student opens /attend?token=<qrToken> in browser,
 * frontend calls POST /api/attendance/qr/confirm with this body.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QRConfirmRequest {

    @NotBlank(message = "QR token is required")
    private String token;
}
