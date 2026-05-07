import type { StudentRecord } from "@/features/student/student-data";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];
}

function arrayOfRecords(value: unknown) {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function deriveAvatarLabel(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "HS";
}

function formatAcademicYear(value: string) {
  return value.replace(/\s*-\s*/g, " - ");
}

export function mapStudentRecord(raw: unknown): StudentRecord {
  const record = asRecord(raw);
  const studentCode = asString(record.studentCode, asString(record.code, "HS00000"));
  const fullName = asString(record.fullName, "Học sinh");
  const transcript = arrayOfRecords(record.transcript).map((item) => ({
    subject: asString(item.subject, "Chưa cập nhật"),
    semester1: asString(item.semester1, "-"),
    semester2: asString(item.semester2, "-"),
    yearAverage: asString(item.yearAverage, "-"),
  }));

  return {
    id: asString(record.id, studentCode),
    studentCode,
    fullName,
    className: asString(record.className, "Chưa phân lớp"),
    academicYear: formatAcademicYear(asString(record.academicYear, "2026-2027")),
    conduct: asString(record.conduct, "Chưa cập nhật"),
    scoreAverage: asString(record.scoreAverage, "0.0"),
    status: asString(record.status, "ACTIVE"),
    homeroomTeacher: asString(record.homeroomTeacher, "Chưa cập nhật"),
    dateOfBirth: asString(record.dateOfBirth, "Chưa cập nhật"),
    gender: asString(record.gender, "Chưa cập nhật"),
    phone: asString(record.phone, "Chưa cập nhật"),
    email: asString(record.email, "Chưa cập nhật"),
    address: asString(record.address, "Chưa cập nhật"),
    avatarLabel: asString(record.avatarLabel, deriveAvatarLabel(fullName)),
    parents: arrayOfRecords(record.parents).map((item) => ({
      role: asString(item.role, "Người giám hộ"),
      fullName: asString(item.fullName, "Chưa cập nhật"),
      phone: asString(item.phone, "Chưa cập nhật"),
      email: asString(item.email, "Chưa cập nhật"),
      accountStatus: asString(item.accountStatus, "Chưa cập nhật"),
    })),
    academicHistory: arrayOfRecords(record.academicHistory).map((item) => ({
      academicYear: formatAcademicYear(asString(item.academicYear, "Chưa cập nhật")),
      className: asString(item.className, "Chưa cập nhật"),
      result: asString(item.result, "Chưa cập nhật"),
      note: asString(item.note, ""),
    })),
    transcript,
    subjectResults: arrayOfRecords(record.subjectResults).map((item) => ({
      academicYear: formatAcademicYear(asString(item.academicYear, "2026-2027")),
      subject: asString(item.subject, "Chưa cập nhật"),
      teacher: asString(item.teacher, "Chưa cập nhật"),
      semester: asString(item.semester, "Học kỳ I"),
      officialAverage: asString(item.officialAverage, "0.0"),
      surveyAverage: asString(item.surveyAverage, "0.0"),
      rank: asString(item.rank, "Chưa xếp loại"),
      assessments: arrayOfRecords(item.assessments).map((assessment) => ({
        assessmentName: asString(assessment.assessmentName, "Đầu điểm"),
        category: asString(assessment.category, "Chính thức"),
        weight: asString(assessment.weight, "Hệ số 1"),
        score: asString(assessment.score, "0"),
        recordedBy: asString(assessment.recordedBy, "Chưa cập nhật"),
        recordedAt: asString(assessment.recordedAt, "Chưa cập nhật"),
        status: asString(assessment.status, "Nháp"),
      })),
    })),
    transcriptOverview: arrayOfRecords(record.transcriptOverview).map((item) => ({
      academicYear: formatAcademicYear(asString(item.academicYear, "2026-2027")),
      className: asString(item.className, "Chưa cập nhật"),
      semesterAverage: asString(item.semesterAverage, "0.0"),
      yearAverage: asString(item.yearAverage, "0.0"),
      academicRank: asString(item.academicRank, "Chưa xếp loại"),
      conduct: asString(item.conduct, "Chưa cập nhật"),
      absences: asString(item.absences, "0 ngày"),
    })),
    alerts: asStringArray(record.alerts),
  };
}

export function mapStudentList(raw: unknown) {
  return Array.isArray(raw) ? raw.map(mapStudentRecord) : [];
}

export function mapSubjectResults(raw: unknown) {
  return arrayOfRecords(raw).map((item) => ({
    academicYear: formatAcademicYear(asString(item.academicYear, "2026 - 2027")),
    subject: asString(item.subject, "Chưa cập nhật"),
    teacher: asString(item.teacher, "Chưa cập nhật"),
    semester: asString(item.semester, "Học kỳ I"),
    officialAverage: asString(item.officialAverage, "0.0"),
    surveyAverage: asString(item.surveyAverage, "0.0"),
    rank: asString(item.rank, "Chưa xếp loại"),
    assessments: arrayOfRecords(item.assessments).map((assessment) => ({
      assessmentName: asString(assessment.assessmentName, "Đầu điểm"),
      category: asString(assessment.category, "CHINH_THUC"),
      weight: asString(assessment.weight, "1.0"),
      score: asString(assessment.score, "0.0"),
      recordedBy: asString(assessment.recordedBy, "Chưa cập nhật"),
      recordedAt: asString(assessment.recordedAt, "Chưa cập nhật"),
      status: asString(assessment.status, "DRAFT"),
    })),
  }));
}

export function mapTranscript(raw: unknown) {
  return arrayOfRecords(raw).map((item) => ({
    subject: asString(item.subject, "Chưa cập nhật"),
    semester1: asString(item.semester1, "-"),
    semester2: asString(item.semester2, "-"),
    yearAverage: asString(item.yearAverage, "-"),
  }));
}

export function mapTranscriptOverview(raw: unknown) {
  return arrayOfRecords(raw).map((item) => ({
    academicYear: formatAcademicYear(asString(item.academicYear, "2026 - 2027")),
    className: asString(item.className, "Chưa cập nhật"),
    semesterAverage: asString(item.semesterAverage, "0.0"),
    yearAverage: asString(item.yearAverage, "0.0"),
    academicRank: asString(item.academicRank, "Chưa xếp loại"),
    conduct: asString(item.conduct, "Chưa cập nhật"),
    absences: asString(item.absences, "0 ngày"),
  }));
}
