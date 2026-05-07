import type {
  DepartmentRecord,
  TeacherAssignment,
  TeacherRecord,
} from "@/features/teacher/teacher-data";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function arrayOfRecords(value: unknown) {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];
}

function formatAcademicYear(value: string) {
  return value.replace(/\s*-\s*/g, " - ");
}

export function mapTeacherAssignment(raw: unknown): TeacherAssignment {
  const record = asRecord(raw);
  return {
    academicYear: formatAcademicYear(asString(record.academicYear, "2026 - 2027")),
    semester: asString(record.semester, "Học kỳ I"),
    className: asString(record.className, "Chưa cập nhật"),
    subject: asString(record.subject, "Chưa cập nhật"),
    room: asString(record.room, "Chưa cập nhật"),
    periods: asString(record.periods, "Chưa cập nhật"),
  };
}

export function mapTeacherRecord(raw: unknown): TeacherRecord {
  const record = asRecord(raw);
  const teacherCode = asString(record.teacherCode, "GV000");

  return {
    id: asString(record.id, teacherCode),
    teacherCode,
    fullName: asString(record.fullName, "Giáo viên"),
    department: asString(record.department, "Chưa cập nhật"),
    title: asString(record.title, "Giáo viên bộ môn"),
    phone: asString(record.phone, "Chưa cập nhật"),
    email: asString(record.email, "Chưa cập nhật"),
    homeroomClass: asString(record.homeroomClass) || undefined,
    subjects: asStringArray(record.subjects),
    employmentStatus: asString(record.employmentStatus, "ACTIVE"),
    bio: asString(record.bio, "Chưa cập nhật"),
    assignments: arrayOfRecords(record.assignments).map(mapTeacherAssignment),
  };
}

export function mapTeacherList(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapTeacherRecord) : [];
}

export function mapDepartmentRecord(raw: unknown): DepartmentRecord {
  const record = asRecord(raw);
  return {
    id: asString(record.id, asString(record.name, "department")),
    name: asString(record.name, "Chưa cập nhật"),
    headTeacher: asString(record.headTeacher, "Chưa cập nhật"),
    viceHeadTeacher: asString(record.viceHeadTeacher, "Chưa cập nhật"),
    teacherCount: asNumber(record.teacherCount),
    subjectCount: asNumber(record.subjectCount),
  };
}

export function mapDepartmentList(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapDepartmentRecord) : [];
}

export type TeacherMetricRecord = {
  label: string;
  value: string;
  trend: string;
  note: string;
};

export function mapTeacherMetric(raw: unknown): TeacherMetricRecord {
  const record = asRecord(raw);
  return {
    label: asString(record.label, "Chỉ số"),
    value: asString(record.value, "0"),
    trend: asString(record.trend, "Realtime"),
    note: asString(record.note, ""),
  };
}

export function mapTeacherMetrics(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapTeacherMetric) : [];
}
