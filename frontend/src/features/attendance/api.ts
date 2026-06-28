import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";
import type {
  AttendanceRecord,
  ClassSession,
  AttendanceStats,
  CurrentTeacherSlot,
} from "./types";

export const attendanceApi = {
  // Manual attendance recording (TEACHER/ADMIN)
  recordManual(
    studentCode: string,
    sessionId: string,
    status: string,
    capturedByCode?: string,
  ) {
    return apiClient.post<ApiResponse<AttendanceRecord>>(
      "/attendance/manual",
      {
        studentCode,
        sessionId,
        status,
        method: "MANUAL",
        capturedByCode,
      },
      { authenticated: true },
    );
  },

  // QR attendance scanning (STUDENT)
  recordQR(studentCode: string, qrData: string, clientIp?: string) {
    return apiClient.post<ApiResponse<AttendanceRecord>>(
      "/attendance/qr",
      {
        studentCode,
        qrData,
        clientIp,
      },
      { authenticated: true },
    );
  },

  // Generate QR code for session (TEACHER/ADMIN)
  generateQRCode(sessionId: string) {
    return apiClient.post<
      ApiResponse<{ qrCode: string; expiryMinutes: string }>
    >(`/attendance/qr/generate/${sessionId}`, {}, { authenticated: true });
  },

  // Get attendance for session (TEACHER/ADMIN)
  getSessionAttendance(sessionId: string) {
    return apiClient.get<ApiResponse<AttendanceRecord[]>>(
      `/attendance/session/${sessionId}`,
      {
        authenticated: true,
      },
    );
  },

  // Get student attendance history (STUDENT/PARENT/ADMIN)
  getStudentAttendance(studentCode: string) {
    return apiClient.get<ApiResponse<AttendanceRecord[]>>(
      `/attendance/student/${studentCode}`,
      { authenticated: true },
    );
  },

  // Get attendance by date range (STUDENT/PARENT/ADMIN)
  getAttendanceByDateRange(
    studentCode: string,
    startDate: string,
    endDate: string,
  ) {
    return apiClient.get<ApiResponse<AttendanceRecord[]>>(
      `/attendance/student/${studentCode}/range?startDate=${startDate}&endDate=${endDate}`,
      { authenticated: true },
    );
  },

  // Update attendance status (TEACHER/ADMIN)
  updateStatus(attendanceId: string, newStatus: string) {
    return apiClient.patch<ApiResponse<AttendanceRecord>>(
      `/attendance/${attendanceId}/status?newStatus=${newStatus}`,
      {},
      { authenticated: true },
    );
  },

  // Delete attendance (TEACHER/ADMIN)
  delete(attendanceId: string) {
    return apiClient.delete<ApiResponse<void>>(`/attendance/${attendanceId}`, {
      authenticated: true,
    });
  },

  // Get class sessions (TEACHER/ADMIN)
  getClassSessions(classCode: string, semesterCode?: string, date?: string) {
    const searchParams = new URLSearchParams();
    if (semesterCode) {
      searchParams.set("semesterCode", semesterCode);
    }
    if (date) {
      searchParams.set("date", date);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `/attendance/class/${classCode}/sessions?${queryString}`
      : `/attendance/class/${classCode}/sessions`;

    return apiClient.get<ApiResponse<ClassSession[]>>(url, {
      authenticated: true,
    });
  },

  getCurrentTeacherSlot() {
    return apiClient.get<ApiResponse<CurrentTeacherSlot>>(
      "/attendance/sessions/current-slot",
      { authenticated: true },
    );
  },

  // Get attendance statistics (STUDENT/PARENT/ADMIN)
  getStats(studentCode: string, startDate: string, endDate: string) {
    return apiClient.get<ApiResponse<AttendanceStats>>(
      `/attendance/student/${studentCode}/stats?startDate=${startDate}&endDate=${endDate}`,
      { authenticated: true },
    );
  },

  // Legacy list method
  list() {
    return apiClient.get<ApiResponse<unknown[]>>("/attendance", {
      authenticated: true,
    });
  },

  /**
   * Confirm attendance via deep-link QR token.
   * Called from the public /attend page after student opens the QR URL.
   */
  confirmQRToken(token: string) {
    return apiClient.post<ApiResponse<{ sessionId: string; subjectName: string; className: string }>>(
      "/attendance/qr/confirm",
      { token },
      { authenticated: true },
    );
  },
};
