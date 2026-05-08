package com.school.school_management.service.attendance;

import com.school.school_management.dto.attendance.AttendanceResponse;
import com.school.school_management.dto.attendance.AttendanceUpsertRequest;
import com.school.school_management.dto.attendance.QRAttendanceRequest;
import com.school.school_management.dto.attendance.QRConfirmRequest;
import com.school.school_management.dto.attendance.QRConfirmResponse;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public interface AttendanceService {

    // List all attendance records (ADMIN/TEACHER)
    List<AttendanceResponse> listAttendance();

    // Manual attendance entry
    AttendanceResponse recordManualAttendance(AttendanceUpsertRequest request);

    // QR code scanning — legacy browser-camera flow (kept for compatibility)
    AttendanceResponse recordQRAttendance(QRAttendanceRequest request);

    /**
     * Generate QR token for a session.
     * Returns a signed JWT (15 min TTL) to be embedded in the deep-link URL.
     */
    String generateQRCode(String sessionId);

    /**
     * Confirm attendance via deep-link QR token.
     * Called by the /attend page after the student opens the QR URL on their phone.
     * The caller must be authenticated as STUDENT.
     */
    QRConfirmResponse confirmQRAttendance(QRConfirmRequest request);

    // Get attendance for a session
    List<AttendanceResponse> getSessionAttendance(String sessionId);

    // Get attendance for a student
    List<AttendanceResponse> getStudentAttendance(String studentCode);

    // Get attendance by date range
    List<AttendanceResponse> getAttendanceByDateRange(String studentCode, OffsetDateTime startDate, OffsetDateTime endDate);

    // Update attendance status (teacher/admin override)
    AttendanceResponse updateAttendance(String attendanceId, String newStatus);

    // Delete attendance record (soft delete)
    void deleteAttendance(String attendanceId);

    // Get all sessions for a class
    List<Map<String, Object>> getClassSessions(String classCode, String semesterCode, LocalDate date);

    // Get current active slot for logged-in teacher
    Map<String, Object> getCurrentTeacherSessionNow();

    // Get attendance statistics for period
    Map<String, Object> getAttendanceStats(String studentCode, OffsetDateTime startDate, OffsetDateTime endDate);
}
