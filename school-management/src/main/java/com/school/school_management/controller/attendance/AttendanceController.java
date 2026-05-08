package com.school.school_management.controller.attendance;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.attendance.AttendanceResponse;
import com.school.school_management.dto.attendance.AttendanceUpsertRequest;
import com.school.school_management.dto.attendance.QRAttendanceRequest;
import com.school.school_management.dto.attendance.QRConfirmRequest;
import com.school.school_management.dto.attendance.QRConfirmResponse;
import com.school.school_management.service.attendance.AttendanceService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> listAttendance() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.listAttendance(), "Attendance list retrieved"));
    }

    /**
     * Record manual attendance entry (TEACHER/ADMIN)
     */
    @PostMapping("/manual")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> recordManualAttendance(
            @Valid @RequestBody AttendanceUpsertRequest request) {
        log.info("Recording manual attendance for student: {} in session: {}", request.getStudentCode(), request.getSessionId());
        AttendanceResponse response = attendanceService.recordManualAttendance(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Manual attendance recorded successfully"));
    }

    /**
     * Record QR code attendance (STUDENT)
     */
    @PostMapping("/qr")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> recordQRAttendance(
            @Valid @RequestBody QRAttendanceRequest request) {
        log.info("Recording QR attendance for student: {}", request.getStudentCode());
        AttendanceResponse response = attendanceService.recordQRAttendance(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "QR attendance recorded successfully"));
    }

    /**
     * Generate QR code for a session (TEACHER/ADMIN).
     * Returns a deep-link URL: {appUrl}/attend?token=<jwt>
     * The URL is encoded as a QR image by the frontend.
     */
    @PostMapping("/qr/generate/{sessionId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateQRCode(@PathVariable String sessionId) {
        log.info("Generating QR code for session: {}", sessionId);
        String qrUrl = attendanceService.generateQRCode(sessionId);
        Map<String, String> response = Map.of(
            "qrCode", qrUrl,          // deep-link URL to encode as QR image
            "expiryMinutes", "15",
            "message", "QR code valid for 15 minutes"
        );
        return ResponseEntity.ok(ApiResponse.success(response, "QR code generated successfully"));
    }

    /**
     * Confirm attendance via deep-link QR token (STUDENT).
     * Called by the /attend page after the student opens the QR URL on their phone.
     */
    @PostMapping("/qr/confirm")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<QRConfirmResponse>> confirmQRAttendance(
            @Valid @RequestBody QRConfirmRequest request) {
        log.info("Confirming QR attendance via deep-link token");
        QRConfirmResponse response = attendanceService.confirmQRAttendance(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "QR attendance confirmed successfully"));
    }

    /**
     * Get attendance records for a session (TEACHER/ADMIN)
     */
    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getSessionAttendance(
            @PathVariable String sessionId) {
        log.info("Fetching attendance for session: {}", sessionId);
        List<AttendanceResponse> response = attendanceService.getSessionAttendance(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response, "Session attendance retrieved"));
    }

    /**
     * Get attendance history for a student (STUDENT/PARENT/ADMIN)
     */
    @GetMapping("/student/{studentCode}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getStudentAttendance(
            @PathVariable String studentCode) {
        log.info("Fetching attendance history for student: {}", studentCode);
        List<AttendanceResponse> response = attendanceService.getStudentAttendance(studentCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Student attendance history retrieved"));
    }

    /**
     * Get attendance records by date range (STUDENT/PARENT/ADMIN)
     */
    @GetMapping("/student/{studentCode}/range")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceByDateRange(
            @PathVariable String studentCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        log.info("Fetching attendance for student: {} from {} to {}", studentCode, startDate, endDate);
        List<AttendanceResponse> response = attendanceService.getAttendanceByDateRange(studentCode, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Attendance records retrieved"));
    }

    /**
     * Update attendance status (TEACHER/ADMIN override)
     */
    @PatchMapping("/{attendanceId}/status")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> updateAttendanceStatus(
            @PathVariable String attendanceId,
            @RequestParam String newStatus) {
        log.info("Updating attendance {} to status: {}", attendanceId, newStatus);
        AttendanceResponse response = attendanceService.updateAttendance(attendanceId, newStatus);
        return ResponseEntity.ok(ApiResponse.success(response, "Attendance status updated"));
    }

    /**
     * Delete attendance record (TEACHER/ADMIN)
     */
    @DeleteMapping("/{attendanceId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAttendance(@PathVariable String attendanceId) {
        log.info("Deleting attendance: {}", attendanceId);
        attendanceService.deleteAttendance(attendanceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Attendance record deleted"));
    }

    /**
     * Get sessions for a class (TEACHER/ADMIN)
     */
    @GetMapping("/class/{classCode}/sessions")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getClassSessions(
            @PathVariable String classCode,
            @RequestParam(required = false) String semesterCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Fetching sessions for class: {} semester: {} date: {}", classCode, semesterCode, date);
        List<Map<String, Object>> response = attendanceService.getClassSessions(classCode, semesterCode, date);
        return ResponseEntity.ok(ApiResponse.success(response, "Class sessions retrieved"));
    }

    /**
     * Get current active slot for logged-in teacher
     */
    @GetMapping("/sessions/current-slot")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentTeacherSessionNow() {
        log.info("Fetching current active slot for teacher");
        Map<String, Object> response = attendanceService.getCurrentTeacherSessionNow();
        return ResponseEntity.ok(ApiResponse.success(response, "Current teacher slot retrieved"));
    }

    /**
     * Get attendance statistics (STUDENT/PARENT/ADMIN)
     */
    @GetMapping("/student/{studentCode}/stats")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttendanceStats(
            @PathVariable String studentCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        log.info("Fetching attendance stats for student: {} from {} to {}", studentCode, startDate, endDate);
        Map<String, Object> response = attendanceService.getAttendanceStats(studentCode, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response, "Attendance statistics retrieved"));
    }
}
