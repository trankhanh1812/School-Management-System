export interface AttendanceRecord {
  attendanceId: string;
  studentCode: string;
  studentName: string;
  sessionId: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  teacherCode: string;
  teacherName: string;
  sessionStartTime: string;
  sessionEndTime: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  capturedByCode?: string;
  capturedByName?: string;
  createdAt: string;
}

export interface ClassSession {
  sessionId: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  semesterCode?: string;
  academicYearCode?: string;
  startTime: string;
  endTime: string;
  teacherCode: string;
  teacherName: string;
  periodLabel?: string;
  isCurrentSlot?: boolean;
}

export interface CurrentTeacherSlot extends ClassSession {
  hasCurrentSlot: boolean;
  date?: string;
  serverTime?: string;
}

export interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  presentRate: number;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "present" | "absent" | "late" | "excused";
export type AttendanceMethod = "MANUAL" | "QR";
