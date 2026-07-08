import type {
  SubjectMetric,
  SubjectRecord,
} from "@/features/subject/subject-data";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mapSubjectRecord(raw: unknown): SubjectRecord {
  const record = asRecord(raw);
  return {
    code: asString(record.code, ""),
    name: asString(record.name, "Chưa cập nhật"),
    departmentCode: asString(record.departmentCode, ""),
    departmentName: asString(record.departmentName, "Chưa cập nhật"),
    gradeLevel: asNumber(record.gradeLevel),
    status: asString(record.status, "ACTIVE"),
    assignmentCount: asNumber(record.assignmentCount),
  };
}

export function mapSubjectList(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapSubjectRecord) : [];
}

export function mapSubjectMetric(raw: unknown): SubjectMetric {
  const record = asRecord(raw);
  return {
    label: asString(record.label, "Chi so"),
    value: asString(record.value, "0"),
    trend: asString(record.trend, "Realtime"),
    note: asString(record.note, ""),
  };
}

export function mapSubjectMetrics(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapSubjectMetric) : [];
}
