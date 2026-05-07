package com.school.school_management.service.attendance;

import com.school.school_management.dto.attendance.AttendanceResponse;
import com.school.school_management.dto.attendance.AttendanceUpsertRequest;
import com.school.school_management.dto.attendance.QRAttendanceRequest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public interface AttendanceService {

    // List all attendance records (ADMIN/TEACHER)
    List<AttendanceResponse> listAttendance();

    // Manual attendance entry
    AttendanceResponse recordManualAttendance(AttendanceUpsertRequest request);

    // QR code scanning
    AttendanceResponse recordQRAttendance(QRAttendanceRequest request);

    // Generate QR code data (returns encoded session info + expiry)
    String generateQRCode(String sessionId);

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
