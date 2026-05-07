import type {
  ClassroomRecord,
  PromotionPlan,
} from "@/features/classroom/classroom-data";

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

function formatAcademicYear(value: string) {
  return value.replace(/\s*-\s*/g, " - ");
}

export type ClassroomMetricRecord = {
  label: string;
  value: string;
  trend: string;
  note: string;
};

export function mapClassroomRecord(raw: unknown): ClassroomRecord {
  const record = asRecord(raw);
  const classCode = asString(record.classCode, "CLS-000");
  return {
    classCode,
    className: asString(record.className, "Chưa cập nhật"),
    grade: asString(record.grade, "Chưa cập nhật"),
    academicYear: formatAcademicYear(asString(record.academicYear, "2026 - 2027")),
    homeroomTeacher: asString(record.homeroomTeacher, "Chưa cập nhật"),
    totalStudents: asNumber(record.totalStudents),
    room: asString(record.room, "Chưa cập nhật"),
    shift: asString(record.shift, "Chưa cập nhật"),
    status: asString(record.status, "Ổn định"),
    notes: asString(record.notes, ""),
  };
}

export function mapClassroomList(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapClassroomRecord) : [];
}

export function mapClassroomMetric(raw: unknown): ClassroomMetricRecord {
  const record = asRecord(raw);
  return {
    label: asString(record.label, "Chỉ số"),
    value: asString(record.value, "0"),
    trend: asString(record.trend, "Realtime"),
    note: asString(record.note, ""),
  };
}

export function mapClassroomMetrics(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapClassroomMetric) : [];
}

export type ClassStudentRecord = {
  studentCode: string;
  fullName: string;
  conduct: string;
  scoreAverage: string;
  status: string;
};

export function mapClassStudentRecord(raw: unknown): ClassStudentRecord {
  const record = asRecord(raw);
  return {
    studentCode: asString(record.studentCode, "HS00000"),
    fullName: asString(record.fullName, "Học sinh"),
    conduct: asString(record.conduct, "Chưa cập nhật"),
    scoreAverage: asString(record.scoreAverage, "0.0"),
    status: asString(record.status, "ACTIVE"),
  };
}

export function mapClassStudentList(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapClassStudentRecord) : [];
}

function asAction(value: unknown): PromotionPlan["action"] {
  return value === "repeat" || value === "transfer" || value === "graduate"
    ? value
    : "promote";
}

function asStatus(value: unknown): PromotionPlan["status"] {
  return value === "reviewed" || value === "approved" ? value : "draft";
}

export function mapPromotionPlan(raw: unknown): PromotionPlan {
  const record = asRecord(raw);
  return {
    studentCode: asString(record.studentCode, "HS00000"),
    studentName: asString(record.studentName, "Học sinh"),
    currentClass: asString(record.currentClass, "Chưa cập nhật"),
    nextAcademicYear: formatAcademicYear(asString(record.nextAcademicYear, "2027 - 2028")),
    proposedClass: asString(record.proposedClass, "Chưa cập nhật"),
    action: asAction(record.action),
    reason: asString(record.reason, ""),
    status: asStatus(record.status),
  };
}

export function mapPromotionPlans(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapPromotionPlan) : [];
}
