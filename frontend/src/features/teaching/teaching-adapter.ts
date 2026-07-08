import type {
  TeachingAssignmentRecord,
  TeachingMetric,
} from "@/features/teaching/teaching-data";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asScheduleData(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asRecord(item))
    .map((record) => ({
      day: typeof record.day === "number" ? record.day : 0,
      period: typeof record.period === "number" ? record.period : 0,
      shift: asString(record.shift, "morning"),
      classCode: asString(record.classCode, ""),
    }))
    .filter((row) => row.day > 0 && row.period > 0 && row.classCode.length > 0);
}

export function mapTeachingAssignmentRecord(
  raw: unknown,
): TeachingAssignmentRecord {
  const record = asRecord(raw);
  return {
    assignmentId: asString(record.assignmentId, ""),
    teacherCode: asString(record.teacherCode, ""),
    teacherName: asString(record.teacherName, "Chưa cập nhật"),
    classCode: asString(record.classCode, ""),
    className: asString(record.className, "Chưa cập nhật"),
    subjectCode: asString(record.subjectCode, ""),
    subjectName: asString(record.subjectName, "Chưa cập nhật"),
    semesterCode: asString(record.semesterCode, ""),
    academicYearCode: asString(record.academicYearCode, ""),
    homeroom: asBoolean(record.homeroom),
    scheduleData: asScheduleData(record.scheduleData),
  };
}

export function mapTeachingAssignmentList(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapTeachingAssignmentRecord) : [];
}

export function mapTeachingMetric(raw: unknown): TeachingMetric {
  const record = asRecord(raw);
  return {
    label: asString(record.label, "Chi so"),
    value: asString(record.value, "0"),
    trend: asString(record.trend, "Realtime"),
    note: asString(record.note, ""),
  };
}

export function mapTeachingMetrics(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapTeachingMetric) : [];
}
