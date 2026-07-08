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

    List<AttendanceResponse> listAttendance();

    AttendanceResponse recordManualAttendance(AttendanceUpsertRequest request);

    AttendanceResponse recordQRAttendance(QRAttendanceRequest request);

    /** Generate QR token — returns deep-link URL: {appUrl}/attend?token=<jwt> */
    String generateQRCode(String sessionId);

    /** Confirm attendance via deep-link QR token (STUDENT) */
    QRConfirmResponse confirmQRAttendance(QRConfirmRequest request);

    List<AttendanceResponse> getSessionAttendance(String sessionId);

    List<AttendanceResponse> getStudentAttendance(String studentCode);

    /** Attendance history of the currently authenticated student (resolved from JWT). */
    List<AttendanceResponse> getMyAttendance();

    /** Attendance statistics of the currently authenticated student (resolved from JWT). */
    Map<String, Object> getMyAttendanceStats(OffsetDateTime startDate, OffsetDateTime endDate);

    List<AttendanceResponse> getAttendanceByDateRange(String studentCode, OffsetDateTime startDate, OffsetDateTime endDate);

    AttendanceResponse updateAttendance(String attendanceId, String newStatus);

    void deleteAttendance(String attendanceId);

    List<Map<String, Object>> getClassSessions(String classCode, String semesterCode, LocalDate date);

    Map<String, Object> getCurrentTeacherSessionNow();

    Map<String, Object> getAttendanceStats(String studentCode, OffsetDateTime startDate, OffsetDateTime endDate);
}
