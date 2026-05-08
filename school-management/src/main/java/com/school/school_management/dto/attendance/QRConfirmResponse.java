package com.school.school_management.dto.attendance;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response returned after a successful QR deep-link attendance confirmation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QRConfirmResponse {

    private String sessionId;
    private String subjectName;
    private String className;
    private String status;   // always "PRESENT"
    private String method;   // always "QR"
}
