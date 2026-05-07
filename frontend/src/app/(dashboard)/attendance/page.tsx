"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { attendanceApi } from "@/features/attendance/api";
import { classroomApi, type ClassroomApiRecord } from "@/features/classroom/api";
import { teachingApi, type TeachingAssignmentApiRecord } from "@/features/teaching/api";
import type {
  AttendanceRecord,
  CurrentTeacherSlot,
  AttendanceStatus,
  ClassSession,
} from "@/features/attendance/types";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useAuthSession } from "@/hooks";
import { useToast } from "@/shared/components/toast-provider";
import { Button } from "@/shared/ui/button";
import { FormSelect, FormInput } from "@/shared/ui/form-field";
import { Modal } from "@/shared/ui/modal";
import { Panel } from "@/shared/ui/panel";
import { useSearchParams } from "next/navigation";

type ManualStatus = Extract<AttendanceStatus, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED">;

const STATUS_OPTIONS: ManualStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

const STATUS_LABEL: Record<ManualStatus, string> = {
  PRESENT: "Có mặt",
  ABSENT: "Vắng",
  LATE: "Trễ",
  EXCUSED: "Có phép",
};

type ManualRosterRow = {
  studentCode: string;
  studentName: string;
  status: ManualStatus;
  attendanceId?: string;
};

type Option = { label: string; value: string };

const TODAY = new Date().toISOString().slice(0, 10);
const DEMO_ACADEMIC_YEAR = "2026-2027";
const DEMO_SEMESTER = "HK1";
const DEMO_CLASS_CODE = "12A1";
const DEMO_CLASS_NAME = "12A1 - Lớp 12A1";
const DEMO_SESSION_ID = "demo-attendance-session";
const DEMO_STUDENTS = [
  { studentCode: "HS1001", studentName: "Nguyễn Minh Anh" },
  { studentCode: "HS1002", studentName: "Trần Gia Huy" },
  { studentCode: "HS1003", studentName: "Lê Hoàng Long" },
  { studentCode: "HS1004", studentName: "Phạm Thu Hà" },
  { studentCode: "HS1005", studentName: "Đặng Ngọc Mai" },
  { studentCode: "HS1006", studentName: "Võ Đức Tài" },
];

const DEMO_SESSION: ClassSession = {
  sessionId: DEMO_SESSION_ID,
  className: DEMO_CLASS_NAME,
  subjectCode: "TOAN",
  subjectName: "Toán",
  semesterCode: DEMO_SEMESTER,
  academicYearCode: DEMO_ACADEMIC_YEAR,
  startTime: `${DEMO_ACADEMIC_YEAR.split("-")[0]}-10-10T07:00:00.000Z`,
  endTime: `${DEMO_ACADEMIC_YEAR.split("-")[0]}-10-10T07:45:00.000Z`,
  teacherCode: "GV001",
  teacherName: "Cô Nguyễn Thị Lan",
  periodLabel: "Tiết 1",
  isCurrentSlot: true,
};

const DEMO_CURRENT_SLOT: CurrentTeacherSlot = {
  ...DEMO_SESSION,
  hasCurrentSlot: true,
  date: TODAY,
  serverTime: new Date().toISOString(),
};

const DEMO_ATTENDANCE_ROWS: AttendanceRecord[] = DEMO_STUDENTS.map((student, index) => ({
  attendanceId: `demo-attendance-${index + 1}`,
  studentCode: student.studentCode,
  studentName: student.studentName,
  sessionId: DEMO_SESSION_ID,
  className: DEMO_CLASS_NAME,
  subjectCode: DEMO_SESSION.subjectCode,
  subjectName: DEMO_SESSION.subjectName,
  teacherCode: DEMO_SESSION.teacherCode,
  teacherName: DEMO_SESSION.teacherName,
  sessionStartTime: DEMO_SESSION.startTime,
  sessionEndTime: DEMO_SESSION.endTime,
  status: (index % 4 === 0 ? "PRESENT" : index % 4 === 1 ? "ABSENT" : index % 4 === 2 ? "LATE" : "EXCUSED") as AttendanceStatus,
  method: index % 2 === 0 ? "MANUAL" : "QR",
  capturedByCode: DEMO_SESSION.teacherCode,
  capturedByName: DEMO_SESSION.teacherName,
  createdAt: new Date().toISOString(),
}));

export default function AttendancePage() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const isTeacher = session?.user.role === "TEACHER";
  const isAdmin = session?.user.role === "ADMIN";
  const canManage = Boolean(isTeacher || isAdmin);
  const initialDemoMode = searchParams.get("demo") === "1";

  const [academicYearCode, setAcademicYearCode] = useState("");
  const [semesterCode, setSemesterCode] = useState("");
  const [classCode, setClassCode] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(TODAY);
  const [demoMode, setDemoMode] = useState(initialDemoMode);

  const [yearOptions, setYearOptions] = useState<Option[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<Option[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignmentApiRecord[]>([]);
  const [classroomRecords, setClassroomRecords] = useState<ClassroomApiRecord[]>([]);

  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [teacherCurrentSlot, setTeacherCurrentSlot] = useState<CurrentTeacherSlot | null>(null);

  const [attendanceRows, setAttendanceRows] = useState<AttendanceRecord[]>([]);
  const [manualRosterRows, setManualRosterRows] = useState<ManualRosterRow[]>([]);
  const [showManualPanel, setShowManualPanel] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((item) => item.sessionId === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  const showDemoPrompt = Boolean(!demoMode && ((isTeacher && teacherCurrentSlot && !teacherCurrentSlot.hasCurrentSlot) || (sessions.length === 0 && selectedSessionId === "")));

  const teacherCanCreateAttendance = useMemo(() => {
    if (!isTeacher) {
      return true;
    }
    if (!selectedSession || !teacherCurrentSlot?.hasCurrentSlot) {
      return false;
    }
    return selectedSession.sessionId === teacherCurrentSlot.sessionId && Boolean(selectedSession.isCurrentSlot);
  }, [isTeacher, selectedSession, teacherCurrentSlot]);

  const qrRemainingSeconds = useMemo(() => {
    if (!qrExpiresAt) {
      return 0;
    }
    return Math.max(0, Math.floor((qrExpiresAt - Date.now()) / 1000));
  }, [qrExpiresAt]);

  useEffect(() => {
    if (!qrExpiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      if (Date.now() >= qrExpiresAt) {
        setQrExpiresAt(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [qrExpiresAt]);

  async function bootstrapOptionsAndDefaults() {
    setLoadingOptions(true);
    try {
      if (demoMode) {
        setYearOptions([{ value: DEMO_ACADEMIC_YEAR, label: DEMO_ACADEMIC_YEAR }]);
        setSemesterOptions([{ value: DEMO_SEMESTER, label: DEMO_SEMESTER }]);
        setClassOptions([{ value: DEMO_CLASS_CODE, label: DEMO_CLASS_NAME }]);
        setAcademicYearCode(DEMO_ACADEMIC_YEAR);
        setSemesterCode(DEMO_SEMESTER);
        setClassCode(DEMO_CLASS_CODE);
        setAttendanceDate(TODAY);
        setTeacherCurrentSlot(DEMO_CURRENT_SLOT);
        setSessions([DEMO_SESSION]);
        setSelectedSessionId(DEMO_SESSION_ID);
        setAttendanceRows(DEMO_ATTENDANCE_ROWS);
        setManualRosterRows(
          DEMO_STUDENTS.map((student, index) => ({
            studentCode: student.studentCode,
            studentName: student.studentName,
            status: normalizeAttendanceStatus(DEMO_ATTENDANCE_ROWS[index]?.status) ?? "ABSENT",
            attendanceId: DEMO_ATTENDANCE_ROWS[index]?.attendanceId,
          }))
        );
        setShowManualPanel(true);
        return;
      }

      const [teachingResponse, classroomResponse] = await Promise.all([
        teachingApi.list(),
        classroomApi.list({ scope: "all", limit: 500 }),
      ]);

      const teachingAssignments = teachingResponse.data ?? [];
      const classrooms = classroomResponse.data ?? [];
      setTeachingAssignments(teachingAssignments);
      setClassroomRecords(classrooms);

      const yearsFromTeaching = uniqueSorted(
        teachingAssignments
          .map((item) => item.academicYearCode?.trim())
          .filter((item): item is string => Boolean(item))
      );

      const yearsFromClassroom = uniqueSorted(
        classrooms
          .map((item) => item.academicYear?.trim())
          .filter((item): item is string => Boolean(item))
      );

      const allYears = uniqueSorted([...yearsFromTeaching, ...yearsFromClassroom]);
      const mappedYears = allYears.map((value) => ({ value, label: value }));
      setYearOptions(mappedYears);

      const targetYear = chooseCurrentAcademicYear(allYears) ?? allYears[0] ?? "";
      if (targetYear) {
        setAcademicYearCode(targetYear);
      }

      const semestersInTargetYear = getSemestersByYear(teachingAssignments, targetYear);

      const mappedSemesters = semestersInTargetYear.map((value) => ({ value, label: value }));
      setSemesterOptions(mappedSemesters);

      const semesterDefault = chooseCurrentSemester(semestersInTargetYear) ?? semestersInTargetYear[0] ?? "";
      if (semesterDefault) {
        setSemesterCode(semesterDefault);
      }

      const mappedClasses = getClassOptionsByYear(classrooms, teachingAssignments, targetYear, isTeacher);

      const dedupClasses = dedupOptions(mappedClasses);
      setClassOptions(dedupClasses);

      if (dedupClasses.length > 0) {
        setClassCode(dedupClasses[0].value);
      }

      if (isTeacher) {
        const currentSlotResponse = await attendanceApi.getCurrentTeacherSlot();
        const currentSlot = currentSlotResponse.data ?? null;
        if (currentSlot?.hasCurrentSlot) {
          setTeacherCurrentSlot(currentSlot);
          setAcademicYearCode(currentSlot.academicYearCode ?? targetYear);
          setSemesterCode(currentSlot.semesterCode ?? semesterDefault);
          setClassCode(currentSlot.className ?? dedupClasses[0]?.value ?? "");
          setAttendanceDate(currentSlot.date ?? TODAY);
          setSelectedSessionId(currentSlot.sessionId ?? "");
        } else {
          setTeacherCurrentSlot(currentSlot ?? { hasCurrentSlot: false } as CurrentTeacherSlot);
        }
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được dữ liệu năm học/học kỳ/lớp", "error");
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    if (!academicYearCode) {
      return;
    }

    const semesters = getSemestersByYear(teachingAssignments, academicYearCode);
    const mappedSemesters = semesters.map((value) => ({ value, label: value }));
    setSemesterOptions(mappedSemesters);

    if (!semesters.includes(semesterCode)) {
      setSemesterCode(chooseCurrentSemester(semesters) ?? semesters[0] ?? "");
    }

    const mappedClasses = getClassOptionsByYear(classroomRecords, teachingAssignments, academicYearCode, isTeacher);
    setClassOptions(mappedClasses);
    if (!mappedClasses.some((item) => item.value === classCode)) {
      setClassCode(mappedClasses[0]?.value ?? "");
    }
  }, [academicYearCode, teachingAssignments, classroomRecords]);

  async function handleFetchSessions() {
    if (demoMode) {
      setSessions([DEMO_SESSION]);
      setSelectedSessionId(DEMO_SESSION_ID);
      return;
    }

    if (!classCode.trim()) {
      showToast("Vui lòng chọn lớp học", "error");
      return;
    }
    if (!semesterCode.trim()) {
      showToast("Vui lòng chọn học kỳ", "error");
      return;
    }
    if (!attendanceDate.trim()) {
      showToast("Vui lòng chọn ngày", "error");
      return;
    }

    setLoadingSessions(true);
    try {
      const response = await attendanceApi.getClassSessions(classCode.trim(), semesterCode.trim(), attendanceDate);
      const rows = response.data ?? [];
      setSessions(rows);

      if (rows.length > 0) {
        if (isTeacher && teacherCurrentSlot?.hasCurrentSlot) {
          const matched = rows.find((item) => item.sessionId === teacherCurrentSlot.sessionId);
          setSelectedSessionId(matched?.sessionId ?? rows[0].sessionId);
        } else {
          setSelectedSessionId(rows[0].sessionId);
        }
      } else {
        setSelectedSessionId("");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được buổi học", "error");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function handleLoadAttendance(sessionId: string) {
    if (!sessionId) {
      setAttendanceRows([]);
      return;
    }

    if (demoMode) {
      setAttendanceRows(DEMO_ATTENDANCE_ROWS.map((item) => ({ ...item })));
      return;
    }

    setLoadingAttendance(true);
    try {
      const response = await attendanceApi.getSessionAttendance(sessionId);
      setAttendanceRows(response.data ?? []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được dữ liệu điểm danh", "error");
    } finally {
      setLoadingAttendance(false);
    }
  }

  async function handleLoadManualRoster(session: ClassSession) {
    if (demoMode) {
      setManualRosterRows(
        DEMO_STUDENTS.map((student, index) => ({
          studentCode: student.studentCode,
          studentName: student.studentName,
          status: normalizeAttendanceStatus(DEMO_ATTENDANCE_ROWS[index]?.status) ?? "ABSENT",
          attendanceId: DEMO_ATTENDANCE_ROWS[index]?.attendanceId,
        }))
      );
      return;
    }

    setLoadingRoster(true);
    try {
      const response = await classroomApi.students(session.className);
      const students = response.data ?? [];
      const attendanceByStudentCode = new Map(
        attendanceRows.map((row) => [row.studentCode.toUpperCase(), row])
      );

      const rosterRows = students
        .filter((student) => Boolean(student.studentCode))
        .map((student) => {
          const studentCode = (student.studentCode ?? "").trim();
          const matchedAttendance = attendanceByStudentCode.get(studentCode.toUpperCase());

          return {
            studentCode,
            studentName: student.fullName?.trim() || studentCode,
            status: normalizeAttendanceStatus(matchedAttendance?.status) ?? "ABSENT",
            attendanceId: matchedAttendance?.attendanceId,
          } satisfies ManualRosterRow;
        });

      setManualRosterRows(rosterRows);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách học sinh theo lớp", "error");
      setManualRosterRows([]);
    } finally {
      setLoadingRoster(false);
    }
  }

  useEffect(() => {
    void bootstrapOptionsAndDefaults();
  }, [demoMode]);

  useEffect(() => {
    if (!classCode || !semesterCode || !attendanceDate) {
      setSessions([]);
      setSelectedSessionId("");
      return;
    }

    void handleFetchSessions();
  }, [classCode, semesterCode, attendanceDate]);

  useEffect(() => {
    if (!selectedSessionId) {
      setAttendanceRows([]);
      setManualRosterRows([]);
      return;
    }

    const session = sessions.find((item) => item.sessionId === selectedSessionId);
    if (!session) {
      setManualRosterRows([]);
      return;
    }

    void (async () => {
      await handleLoadAttendance(selectedSessionId);
      await handleLoadManualRoster(session);
    })();
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    setManualRosterRows((previousRows) => {
      if (previousRows.length === 0) {
        return previousRows;
      }

      const attendanceByStudentCode = new Map(
        attendanceRows.map((row) => [row.studentCode.toUpperCase(), row])
      );

      return previousRows.map((row) => {
        const matchedAttendance = attendanceByStudentCode.get(row.studentCode.toUpperCase());
        return {
          ...row,
          attendanceId: matchedAttendance?.attendanceId,
          status: normalizeAttendanceStatus(matchedAttendance?.status) ?? row.status,
        };
      });
    });
  }, [attendanceRows]);

  async function handleGenerateQr() {
    if (!selectedSessionId) {
      showToast("Vui lòng chọn tiết học", "error");
      return;
    }
    if (!teacherCanCreateAttendance) {
      showToast("Giáo viên chỉ được tạo QR đúng tiết đang dạy hiện tại", "error");
      return;
    }

    try {
      if (demoMode) {
        const fakeQr = `demo-attendance:${selectedSessionId}:${Date.now()}`;
        setQrValue(fakeQr);
        const qrDataUrl = await QRCode.toDataURL(fakeQr, { width: 320, margin: 2 });
        setQrImageUrl(qrDataUrl);
        setQrExpiresAt(Date.now() + 15 * 60 * 1000);
        setQrModalOpen(true);
        showToast("Đã tạo QR demo cho giao diện kiểm thử", "success");
        return;
      }

      const response = await attendanceApi.generateQRCode(selectedSessionId);
      const payload = response.data;
      if (!payload?.qrCode) {
        showToast("Không tạo được mã QR", "error");
        return;
      }

      setQrValue(payload.qrCode);
      const qrDataUrl = await QRCode.toDataURL(payload.qrCode, { width: 320, margin: 2 });
      setQrImageUrl(qrDataUrl);

      const minutes = Number(payload.expiryMinutes ?? "15") || 15;
      setQrExpiresAt(Date.now() + minutes * 60 * 1000);
      setQrModalOpen(true);
      showToast("Đã tạo mã QR cho buổi học", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tạo được QR", "error");
    }
  }

  async function handleManualAttendance() {
    if (!selectedSessionId) {
      showToast("Vui lòng chọn buổi học", "error");
      return;
    }
    if (manualRosterRows.length === 0) {
      showToast("Chưa có danh sách học sinh để điểm danh", "error");
      return;
    }
    if (!teacherCanCreateAttendance) {
      showToast("Giáo viên chỉ được tạo điểm danh đúng tiết đang dạy hiện tại", "error");
      return;
    }

    setSavingManual(true);
    try {
      if (demoMode) {
        const nextRows = manualRosterRows.map((row) => {
          const matched = DEMO_ATTENDANCE_ROWS.find((item) => item.studentCode === row.studentCode);
          return {
            ...matched,
            attendanceId: row.attendanceId ?? matched?.attendanceId ?? `demo-attendance-${row.studentCode}`,
            studentCode: row.studentCode,
            studentName: row.studentName,
            sessionId: DEMO_SESSION_ID,
            className: DEMO_CLASS_NAME,
            subjectCode: DEMO_SESSION.subjectCode,
            subjectName: DEMO_SESSION.subjectName,
            teacherCode: DEMO_SESSION.teacherCode,
            teacherName: DEMO_SESSION.teacherName,
            sessionStartTime: DEMO_SESSION.startTime,
            sessionEndTime: DEMO_SESSION.endTime,
            status: row.status,
            method: "MANUAL",
            capturedByCode: DEMO_SESSION.teacherCode,
            capturedByName: DEMO_SESSION.teacherName,
            createdAt: new Date().toISOString(),
          } satisfies AttendanceRecord;
        });
        setAttendanceRows(nextRows);
        showToast("Đã lưu điểm danh demo", "success");
        return;
      }

      const operations = manualRosterRows.map(async (row) => {
        if (row.attendanceId) {
          return attendanceApi.updateStatus(row.attendanceId, row.status);
        }
        return attendanceApi.recordManual(row.studentCode, selectedSessionId, row.status);
      });

      const results = await Promise.allSettled(operations);
      const failedCount = results.filter((item) => item.status === "rejected").length;

      if (failedCount > 0) {
        showToast(`Đã lưu một phần: ${manualRosterRows.length - failedCount}/${manualRosterRows.length} học sinh`, "error");
      } else {
        showToast("Đã lưu điểm danh thủ công cho cả lớp", "success");
      }

      await handleLoadAttendance(selectedSessionId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể điểm danh thủ công", "error");
    } finally {
      setSavingManual(false);
    }
  }

  async function handleUpdateRowStatus(attendanceId: string, status: AttendanceStatus) {
    setSavingRowId(attendanceId);
    try {
      if (demoMode) {
        setAttendanceRows((previous) =>
          previous.map((item) => (item.attendanceId === attendanceId ? { ...item, status } : item))
        );
        setManualRosterRows((previous) =>
          previous.map((item) => (item.attendanceId === attendanceId ? { ...item, status: status as ManualStatus } : item))
        );
        showToast("Đã cập nhật trạng thái demo", "success");
        return;
      }

      await attendanceApi.updateStatus(attendanceId, status);
      showToast("Đã cập nhật trạng thái", "success");
      await handleLoadAttendance(selectedSessionId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể cập nhật trạng thái", "error");
    } finally {
      setSavingRowId(null);
    }
  }

  async function handleDeleteRow(attendanceId: string) {
    setDeletingRowId(attendanceId);
    try {
      if (demoMode) {
        setAttendanceRows((previous) => previous.filter((item) => item.attendanceId !== attendanceId));
        setManualRosterRows((previous) => previous.map((item) => (item.attendanceId === attendanceId ? { ...item, attendanceId: undefined } : item)));
        showToast("Đã xóa bản ghi demo", "success");
        return;
      }

      await attendanceApi.delete(attendanceId);
      showToast("Đã xóa bản ghi điểm danh", "success");
      await handleLoadAttendance(selectedSessionId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể xóa bản ghi", "error");
    } finally {
      setDeletingRowId(null);
    }
  }

  if (!canManage) {
    return (
      <Panel className="p-6 text-sm text-rose-700">
        Màn quản trị điểm danh chỉ dành cho TEACHER hoặc ADMIN.
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Attendance"
        title="Quản lý điểm danh"
        description="Chọn theo thứ tự Năm học - Học kỳ - Lớp - Ngày - Tiết học, sau đó tạo QR hoặc mở điểm danh thủ công."
      />

      {showDemoPrompt ? (
        <Panel className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Chưa có tiết thật để điểm danh.</p>
              <p className="mt-1 text-sm text-amber-800">Bạn có thể bật dữ liệu demo để kiểm tra toàn bộ giao diện, QR và bảng điểm danh ngay trên màn hình này.</p>
            </div>
            <Button onClick={() => setDemoMode(true)} tone="secondary">
              Bật dữ liệu demo
            </Button>
          </div>
        </Panel>
      ) : null}

      {demoMode ? (
        <Panel className="border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          Đang chạy ở chế độ demo. Dữ liệu, QR và thao tác lưu/xóa chỉ thay đổi trên giao diện hiện tại, không gọi API thật.
        </Panel>
      ) : null}

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-5">
          <FormSelect
            label="Năm học"
            value={academicYearCode}
            onChange={(event) => setAcademicYearCode(event.target.value)}
            disabled={loadingOptions || yearOptions.length === 0 || (isTeacher && Boolean(teacherCurrentSlot?.hasCurrentSlot))}
          >
            <option value="">Chọn năm học</option>
            {yearOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </FormSelect>

          <FormSelect
            label="Học kỳ"
            value={semesterCode}
            onChange={(event) => setSemesterCode(event.target.value)}
            disabled={loadingOptions || semesterOptions.length === 0 || (isTeacher && Boolean(teacherCurrentSlot?.hasCurrentSlot))}
          >
            <option value="">Chọn học kỳ</option>
            {semesterOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </FormSelect>

          <FormSelect
            label="Lớp học"
            value={classCode}
            onChange={(event) => setClassCode(event.target.value)}
            disabled={loadingOptions || classOptions.length === 0 || (isTeacher && Boolean(teacherCurrentSlot?.hasCurrentSlot))}
          >
            <option value="">Chọn lớp</option>
            {classOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </FormSelect>

          <FormInput
            label="Ngày"
            type="date"
            value={attendanceDate}
            onChange={(event) => setAttendanceDate(event.target.value)}
            disabled={isTeacher && Boolean(teacherCurrentSlot?.hasCurrentSlot)}
          />

          <FormSelect
            label="Tiết học"
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
          >
            <option value="">Chọn tiết học</option>
            {sessions.map((item) => (
              <option key={item.sessionId} value={item.sessionId}>
                {formatSessionOption(item)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => void handleGenerateQr()}
            disabled={!selectedSessionId || !teacherCanCreateAttendance}
          >
            Tạo QR điểm danh
          </Button>
          <Button
            tone="secondary"
            onClick={() => setShowManualPanel((previous) => !previous)}
            disabled={!selectedSessionId || !teacherCanCreateAttendance}
          >
            {showManualPanel ? "Đóng điểm danh thủ công" : "Điểm danh thủ công"}
          </Button>
          <Button tone="ghost" onClick={() => void handleLoadAttendance(selectedSessionId)} disabled={!selectedSessionId || loadingAttendance}>
            {loadingAttendance ? "Đang tải..." : "Làm mới dữ liệu"}
          </Button>
          {loadingSessions ? <span className="self-center text-xs text-slate-500">Đang tải danh sách tiết...</span> : null}
        </div>

        {selectedSession ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Tiết đang chọn: <span className="font-semibold">{formatSessionOption(selectedSession)}</span>
          </div>
        ) : null}

        {isTeacher && !teacherCanCreateAttendance ? (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Giáo viên chỉ được phép tạo điểm danh khi chọn đúng tiết đang diễn ra theo thời gian hệ thống.
          </div>
        ) : null}
      </Panel>

      {showManualPanel ? (
      <Panel className="p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Điểm danh thủ công</h3>
        <p className="mt-1 text-sm text-slate-600">Chọn buổi học để tải danh sách học sinh và đánh dấu trạng thái theo từng em.</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            tone="secondary"
            onClick={() => {
              setManualRosterRows((previous) => previous.map((item) => ({ ...item, status: "PRESENT" })));
            }}
            disabled={manualRosterRows.length === 0 || savingManual}
          >
            Đánh dấu tất cả có mặt
          </Button>
          <Button
            tone="secondary"
            onClick={() => {
              setManualRosterRows((previous) => previous.map((item) => ({ ...item, status: "ABSENT" })));
            }}
            disabled={manualRosterRows.length === 0 || savingManual}
          >
            Đánh dấu tất cả vắng
          </Button>
          <Button
            onClick={() => void handleManualAttendance()}
            disabled={!selectedSessionId || savingManual || manualRosterRows.length === 0}
          >
            {savingManual ? "Đang lưu..." : "Lưu điểm danh cả lớp"}
          </Button>
          <Button
            tone="ghost"
            onClick={() => {
              if (selectedSession) {
                void handleLoadManualRoster(selectedSession);
              }
            }}
            disabled={!selectedSession || loadingRoster || savingManual}
          >
            {loadingRoster ? "Đang tải danh sách..." : "Tải lại danh sách lớp"}
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Học sinh</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Có mặt</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Trạng thái</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Bản ghi hiện có</th>
              </tr>
            </thead>
            <tbody>
              {manualRosterRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-5 text-slate-500" colSpan={4}>
                    {selectedSessionId
                      ? loadingRoster
                        ? "Đang tải danh sách học sinh..."
                        : "Không có học sinh trong lớp hoặc chưa tải được danh sách."
                      : "Vui lòng chọn buổi học để bắt đầu điểm danh thủ công."}
                  </td>
                </tr>
              ) : (
                manualRosterRows.map((row) => (
                  <tr key={row.studentCode} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-800">
                      <div>
                        <p className="font-medium">{row.studentName}</p>
                        <p className="text-xs text-slate-500">{row.studentCode}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={row.status === "PRESENT"}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setManualRosterRows((previous) =>
                              previous.map((item) =>
                                item.studentCode === row.studentCode
                                  ? { ...item, status: checked ? "PRESENT" : "ABSENT" }
                                  : item
                              )
                            );
                          }}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {row.status === "PRESENT" ? "Có mặt" : "Không"}
                      </label>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={row.status}
                        onChange={(event) => {
                          const nextStatus = event.target.value as Extract<AttendanceStatus, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED">;
                          setManualRosterRows((previous) =>
                            previous.map((item) =>
                              item.studentCode === row.studentCode ? { ...item, status: nextStatus } : item
                            )
                          );
                        }}
                        className="h-9 rounded-lg border border-slate-200 px-2 text-xs"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABEL[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {row.attendanceId ? "Đã có (sẽ cập nhật)" : "Chưa có (sẽ tạo mới)"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      ) : null}

      <Panel className="p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Danh sách điểm danh theo buổi</h3>
        <p className="mt-1 text-sm text-slate-600">Cập nhật hoặc chỉnh sửa bản ghi điểm danh trong buổi đã chọn.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Học sinh</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Trạng thái</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Phương thức</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Người ghi nhận</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-5 text-slate-500" colSpan={5}>
                    {selectedSessionId ? "Chưa có bản ghi điểm danh." : "Vui lòng chọn buổi học để xem dữ liệu."}
                  </td>
                </tr>
              ) : (
                attendanceRows.map((row) => (
                  <AttendanceRow
                    key={row.attendanceId}
                    row={row}
                    saving={savingRowId === row.attendanceId}
                    deleting={deletingRowId === row.attendanceId}
                    onUpdate={(status) => void handleUpdateRowStatus(row.attendanceId, status)}
                    onDelete={() => void handleDeleteRow(row.attendanceId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Mã QR điểm danh"
        description="Hiển thị QR này để học sinh quét check-in."
        footer={
          <>
            <Button tone="secondary" onClick={() => setQrModalOpen(false)}>
              Đóng
            </Button>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(qrValue);
                  showToast("Đã sao chép mã QR thô", "success");
                } catch {
                  showToast("Không thể sao chép mã", "error");
                }
              }}
            >
              Sao chép mã
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex justify-center">
            {qrImageUrl ? (
              <img src={qrImageUrl} alt="QR điểm danh" className="h-72 w-72 rounded-2xl border border-slate-200 bg-white p-3" />
            ) : (
              <div className="flex h-72 w-72 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                Đang tạo QR...
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {qrRemainingSeconds > 0
              ? `QR còn hiệu lực: ${Math.floor(qrRemainingSeconds / 60)}:${String(qrRemainingSeconds % 60).padStart(2, "0")}`
              : "QR đã hết hạn. Vui lòng tạo lại mã mới."}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AttendanceRow({
  row,
  saving,
  deleting,
  onUpdate,
  onDelete,
}: {
  row: AttendanceRecord;
  saving: boolean;
  deleting: boolean;
  onUpdate: (status: AttendanceStatus) => void;
  onDelete: () => void;
}) {
  const [nextStatus, setNextStatus] = useState<AttendanceStatus>(row.status.toUpperCase() as AttendanceStatus);

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-3 text-slate-800">
        <div>
          <p className="font-medium">{row.studentName}</p>
          <p className="text-xs text-slate-500">{row.studentCode}</p>
        </div>
      </td>
      <td className="px-3 py-3 text-slate-700">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">{row.status}</span>
      </td>
      <td className="px-3 py-3 text-slate-700">
        <span className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{row.method}</span>
      </td>
      <td className="px-3 py-3 text-slate-700">{row.capturedByName ?? "QR tự động"}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <select
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as AttendanceStatus)}
            className="h-9 rounded-lg border border-slate-200 px-2 text-xs"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <Button className="px-3 py-2 text-xs" tone="secondary" onClick={() => onUpdate(nextStatus)} disabled={saving || deleting}>
            {saving ? "Đang lưu" : "Cập nhật"}
          </Button>
          <Button className="px-3 py-2 text-xs" tone="ghost" onClick={onDelete} disabled={saving || deleting}>
            {deleting ? "Đang xóa" : "Xóa"}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function normalizeAttendanceStatus(status?: string): ManualStatus | null {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toUpperCase();
  if (normalized === "PRESENT" || normalized === "ABSENT" || normalized === "LATE" || normalized === "EXCUSED") {
    return normalized;
  }

  return null;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => b.localeCompare(a));
}

function dedupOptions(options: Option[]) {
  const seen = new Set<string>();
  return options.filter((item) => {
    if (seen.has(item.value)) {
      return false;
    }
    seen.add(item.value);
    return true;
  });
}

function chooseCurrentAcademicYear(years: string[]) {
  if (years.length === 0) {
    return null;
  }

  const now = new Date();
  const currentYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const candidate = years.find((item) => item.includes(String(currentYear)));
  return candidate ?? years[0];
}

function chooseCurrentSemester(semesters: string[]) {
  if (semesters.length === 0) {
    return null;
  }

  const month = new Date().getMonth() + 1;
  const preferSemesterOne = month >= 8 || month <= 12;
  const matcher = preferSemesterOne
    ? (value: string) => /(^|[^0-9])1([^0-9]|$)|I/i.test(value)
    : (value: string) => /(^|[^0-9])2([^0-9]|$)|II/i.test(value);

  const matched = semesters.find(matcher);
  return matched ?? semesters[0];
}

function formatSessionOption(session: ClassSession) {
  const period = session.periodLabel ?? "Tiết";
  const teacher = session.teacherName ?? "Chưa có GV";
  const start = session.startTime ? new Date(session.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const end = session.endTime ? new Date(session.endTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  return `${period} · ${session.subjectName} · ${teacher} · ${start}-${end}`;
}

function getSemestersByYear(assignments: TeachingAssignmentApiRecord[], academicYearCode: string) {
  return uniqueSorted(
    assignments
      .filter((item) => (item.academicYearCode ?? "").toUpperCase() === academicYearCode.toUpperCase())
      .map((item) => item.semesterCode?.trim())
      .filter((item): item is string => Boolean(item))
  );
}

function getClassOptionsByYear(
  classrooms: ClassroomApiRecord[],
  assignments: TeachingAssignmentApiRecord[],
  academicYearCode: string,
  isTeacher: boolean
) {
  const teacherClassCodes = new Set(
    assignments
      .filter((item) => (item.academicYearCode ?? "").toUpperCase() === academicYearCode.toUpperCase())
      .map((item) => item.classCode?.trim().toUpperCase())
      .filter((item): item is string => Boolean(item))
  );

  const mapped = classrooms
    .filter((item) => {
      const code = item.classCode?.trim().toUpperCase();
      if (!code) {
        return false;
      }
      if (isTeacher) {
        return teacherClassCodes.has(code);
      }
      return (item.academicYear ?? "").toUpperCase() === academicYearCode.toUpperCase();
    })
    .map((item) => ({
      value: item.classCode ?? "",
      label: `${item.classCode ?? ""} - ${item.className ?? item.classCode ?? ""}`,
    }));

  return dedupOptions(mapped);
}
