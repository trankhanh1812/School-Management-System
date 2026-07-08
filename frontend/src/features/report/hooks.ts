"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { attendanceApi } from "@/features/attendance/api";
import { classroomApi } from "@/features/classroom/api";
import { examApi } from "@/features/exam/api";
import { scoreApi } from "@/features/score/api";
import { studentApi } from "@/features/student/api";
import { subjectApi } from "@/features/subject/api";
import { teacherApi } from "@/features/teacher/api";
import { teachingApi } from "@/features/teaching/api";
import type {
  ClassPerformanceItem,
  DepartmentLoadItem,
  DistributionItem,
  EducationAnalyticsSnapshot,
  ReportExportItem,
  ReportFilters,
  ReportMetric,
  RiskAlertItem,
  SubjectLoadItem,
  TeacherLoadItem,
  TopStudentItem,
  TrendPoint,
} from "@/features/report/types";

export function useReportFilters(initialFilters: ReportFilters = {}) {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);

  return {
    filters,
    setFilters,
  };
}

const PASSING_SCORE = 5;

type StudentLite = {
  studentCode: string;
  fullName: string;
  className: string;
  scoreAverage: number;
  conduct: string;
  gender: string;
};

type TeacherLite = {
  teacherCode: string;
  fullName: string;
  department: string;
  homeroomClass: string;
};

type ClassLite = {
  classCode: string;
  className: string;
  academicYear: string;
  homeroomTeacher: string;
  totalStudents: number;
};

type SubjectLite = {
  code: string;
  name: string;
  departmentName: string;
};

type AssignmentLite = {
  teacherCode: string;
  classCode: string;
  subjectCode: string;
  subjectName: string;
};

type ScoreLite = {
  examId: string;
  scoreValue: number;
  status: string;
};

type AttendanceLite = {
  className: string;
  status: string;
};

type ExamLite = {
  examId: string;
  examDate: string;
  title: string;
};

function parseNumber(input: unknown, fallback = 0) {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }

  if (typeof input === "string") {
    const normalized = input.replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function asString(input: unknown, fallback = "") {
  return typeof input === "string" ? input : fallback;
}

function toDistributionMap(items: string[]) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = item.trim().length > 0 ? item.trim() : "Khác";
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
}

function toDistributionItems(map: Map<string, number>): DistributionItem[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "0%";
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function classifyAcademicRank(score: number) {
  if (score >= 8) {
    return "Giỏi";
  }
  if (score >= 6.5) {
    return "Khá";
  }
  if (score >= 5) {
    return "Trung bình";
  }
  return "Cần hỗ trợ";
}

function normalizeConduct(input: string) {
  const normalized = input.trim().toUpperCase();
  if (["EXCELLENT", "TOT", "TỐT"].includes(normalized)) {
    return "Tốt";
  }
  if (["GOOD", "KHA", "KHÁ"].includes(normalized)) {
    return "Khá";
  }
  if (["AVERAGE", "TRUNG BINH", "TRUNG BÌNH"].includes(normalized)) {
    return "Trung bình";
  }
  if (["POOR", "YEU", "YẾU"].includes(normalized)) {
    return "Yếu";
  }
  return input.trim().length > 0 ? input : "Chưa cập nhật";
}

function normalizeGender(input: string) {
  const normalized = input.trim().toUpperCase();
  if (["MALE", "NAM"].includes(normalized)) {
    return "Nam";
  }
  if (["FEMALE", "NU", "NỮ"].includes(normalized)) {
    return "Nữ";
  }
  return "Khác";
}

function normalizeScoreStatus(input: string) {
  const normalized = input.trim().toUpperCase();
  if (normalized.length === 0) {
    return "Không rõ";
  }
  return normalized;
}

function normalizeAttendanceStatus(input: string) {
  const normalized = input.trim().toUpperCase();
  if (["PRESENT", "CO_MAT"].includes(normalized)) {
    return "PRESENT";
  }
  if (["LATE", "DI_MUON"].includes(normalized)) {
    return "LATE";
  }
  if (["EXCUSED", "PHEP"].includes(normalized)) {
    return "EXCUSED";
  }
  if (["ABSENT", "VANG"].includes(normalized)) {
    return "ABSENT";
  }
  return "OTHER";
}

function monthLabel(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Không rõ";
  }
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function buildReportExports(): ReportExportItem[] {
  return [
    {
      reportName: "Báo cáo học lực tổng hợp",
      scope: "Toàn trường theo năm học",
      format: "PDF / Excel",
      source: "students + scores + classes",
    },
    {
      reportName: "Thống kê điểm danh",
      scope: "Theo lớp, học kỳ, tháng",
      format: "PDF / Dashboard",
      source: "attendance + classes",
    },
    {
      reportName: "Tải giảng dạy giáo viên",
      scope: "Theo giáo viên / bộ môn",
      format: "Excel",
      source: "teachers + teaching-assignments",
    },
    {
      reportName: "Theo dõi kỳ thi và kết quả",
      scope: "Theo môn học / đợt thi",
      format: "PDF / Excel",
      source: "exams + scores",
    },
  ];
}

function emptySnapshot(): EducationAnalyticsSnapshot {
  return {
    reportMetrics: [],
    conductDistribution: [],
    academicRankDistribution: [],
    scoreStatusDistribution: [],
    genderDistribution: [],
    attendanceDistribution: [],
    classPerformance: [],
    teacherLoad: [],
    subjectLoad: [],
    departmentLoad: [],
    topStudents: [],
    examTimeline: [],
    scoreTimeline: [],
    riskAlerts: [],
    reportExports: buildReportExports(),
  };
}

function settleData<T>(
  result: PromiseSettledResult<{ data: T }>,
  fallback: T,
): T {
  if (result.status === "fulfilled") {
    return result.value.data;
  }
  return fallback;
}

function mapStudents(raw: unknown): StudentLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      studentCode: asString(record.studentCode, "HS-NA"),
      fullName: asString(record.fullName, "Học sinh"),
      className: asString(record.className, "Chưa phân lớp"),
      scoreAverage: parseNumber(record.scoreAverage),
      conduct: normalizeConduct(asString(record.conduct, "")),
      gender: normalizeGender(asString(record.gender, "")),
    };
  });
}

function mapTeachers(raw: unknown): TeacherLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      teacherCode: asString(record.teacherCode, "GV-NA"),
      fullName: asString(record.fullName, "Giáo viên"),
      department: asString(record.department, "Chưa cập nhật"),
      homeroomClass: asString(record.homeroomClass, "Không có"),
    };
  });
}

function mapClasses(raw: unknown): ClassLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      classCode: asString(record.classCode, "CLS-NA"),
      className: asString(record.className, "Lớp"),
      academicYear: asString(record.academicYear, "N/A"),
      homeroomTeacher: asString(record.homeroomTeacher, "Chưa cập nhật"),
      totalStudents: parseNumber(record.totalStudents),
    };
  });
}

function mapSubjects(raw: unknown): SubjectLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      code: asString(record.code, "SUB-NA"),
      name: asString(record.name, "Môn học"),
      departmentName: asString(record.departmentName, "Khác"),
    };
  });
}

function mapAssignments(raw: unknown): AssignmentLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      teacherCode: asString(record.teacherCode, ""),
      classCode: asString(record.classCode, ""),
      subjectCode: asString(record.subjectCode, ""),
      subjectName: asString(record.subjectName, "Chưa cập nhật"),
    };
  });
}

function mapScores(raw: unknown): ScoreLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      examId: asString(record.examId, ""),
      scoreValue: parseNumber(record.scoreValue),
      status: normalizeScoreStatus(asString(record.status, "")),
    };
  });
}

function mapAttendance(raw: unknown): AttendanceLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      className: asString(record.className, "Chưa rõ lớp"),
      status: normalizeAttendanceStatus(asString(record.status, "")),
    };
  });
}

function mapExams(raw: unknown): ExamLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    return {
      examId: asString(record.examId, ""),
      examDate: asString(record.examDate, ""),
      title: asString(record.title, "Bài kiểm tra"),
    };
  });
}

function buildSnapshot(payload: {
  students: StudentLite[];
  teachers: TeacherLite[];
  classes: ClassLite[];
  subjects: SubjectLite[];
  assignments: AssignmentLite[];
  scores: ScoreLite[];
  attendance: AttendanceLite[];
  exams: ExamLite[];
}): EducationAnalyticsSnapshot {
  const {
    students,
    teachers,
    classes,
    subjects,
    assignments,
    scores,
    attendance,
    exams,
  } = payload;

  const topStudents: TopStudentItem[] = [...students]
    .sort((a, b) => b.scoreAverage - a.scoreAverage)
    .slice(0, 10)
    .map((item) => ({
      studentCode: item.studentCode,
      fullName: item.fullName,
      className: item.className,
      scoreAverage: item.scoreAverage.toFixed(2),
      conduct: item.conduct,
    }));

  const classPerformance: ClassPerformanceItem[] = classes
    .map((item) => {
      const classStudents = students.filter(
        (student) => student.className === item.className,
      );
      const averageScore = classStudents.length
        ? classStudents.reduce(
            (sum, student) => sum + student.scoreAverage,
            0,
          ) / classStudents.length
        : 0;
      const passCount = classStudents.filter(
        (student) => student.scoreAverage >= PASSING_SCORE,
      ).length;
      return {
        className: item.className,
        academicYear: item.academicYear,
        totalStudents:
          classStudents.length > 0 ? classStudents.length : item.totalStudents,
        averageScore: averageScore.toFixed(2),
        passRate: formatPercent(passCount, classStudents.length),
        homeroomTeacher: item.homeroomTeacher,
      };
    })
    .sort(
      (a, b) =>
        Number.parseFloat(b.averageScore) - Number.parseFloat(a.averageScore),
    );

  const teacherAssignmentMap = new Map<string, number>();
  assignments.forEach((item) => {
    if (item.teacherCode.length === 0) {
      return;
    }
    teacherAssignmentMap.set(
      item.teacherCode,
      (teacherAssignmentMap.get(item.teacherCode) ?? 0) + 1,
    );
  });

  const teacherLoad: TeacherLoadItem[] = teachers
    .map((item) => ({
      teacherCode: item.teacherCode,
      fullName: item.fullName,
      department: item.department,
      totalAssignments: teacherAssignmentMap.get(item.teacherCode) ?? 0,
      homeroomClass: item.homeroomClass,
    }))
    .sort((a, b) => b.totalAssignments - a.totalAssignments);

  const subjectStats = new Map<
    string,
    {
      name: string;
      assignmentCount: number;
      teachers: Set<string>;
      classes: Set<string>;
    }
  >();
  assignments.forEach((item) => {
    if (item.subjectCode.length === 0) {
      return;
    }

    if (!subjectStats.has(item.subjectCode)) {
      subjectStats.set(item.subjectCode, {
        name: item.subjectName,
        assignmentCount: 0,
        teachers: new Set<string>(),
        classes: new Set<string>(),
      });
    }

    const bucket = subjectStats.get(item.subjectCode);
    if (!bucket) {
      return;
    }
    bucket.assignmentCount += 1;
    if (item.teacherCode.length > 0) {
      bucket.teachers.add(item.teacherCode);
    }
    if (item.classCode.length > 0) {
      bucket.classes.add(item.classCode);
    }
  });

  subjects.forEach((item) => {
    if (!subjectStats.has(item.code)) {
      subjectStats.set(item.code, {
        name: item.name,
        assignmentCount: 0,
        teachers: new Set<string>(),
        classes: new Set<string>(),
      });
    }
  });

  const subjectLoad: SubjectLoadItem[] = [...subjectStats.entries()]
    .map(([subjectCode, value]) => ({
      subjectCode,
      subjectName: value.name,
      assignmentCount: value.assignmentCount,
      teacherCount: value.teachers.size,
      classCount: value.classes.size,
    }))
    .sort((a, b) => b.assignmentCount - a.assignmentCount);

  const departmentLoadMap = new Map<string, DepartmentLoadItem>();
  teachers.forEach((teacher) => {
    const current = departmentLoadMap.get(teacher.department) ?? {
      department: teacher.department,
      teacherCount: 0,
      assignmentCount: 0,
    };
    current.teacherCount += 1;
    current.assignmentCount +=
      teacherAssignmentMap.get(teacher.teacherCode) ?? 0;
    departmentLoadMap.set(teacher.department, current);
  });

  const departmentLoad = [...departmentLoadMap.values()].sort(
    (a, b) => b.assignmentCount - a.assignmentCount,
  );

  const conductDistribution = toDistributionItems(
    toDistributionMap(students.map((item) => item.conduct)),
  );

  const academicRankDistribution = toDistributionItems(
    toDistributionMap(
      students.map((item) => classifyAcademicRank(item.scoreAverage)),
    ),
  );

  const scoreStatusDistribution = toDistributionItems(
    toDistributionMap(scores.map((item) => item.status)),
  );

  const genderDistribution = toDistributionItems(
    toDistributionMap(students.map((item) => item.gender)),
  );

  const attendanceDistribution = toDistributionItems(
    toDistributionMap(attendance.map((item) => item.status)),
  );

  const attendancePresentLike = attendance.filter((item) =>
    ["PRESENT", "LATE", "EXCUSED"].includes(item.status),
  ).length;

  const averageScore = scores.length
    ? (
        scores.reduce((sum, item) => sum + item.scoreValue, 0) / scores.length
      ).toFixed(2)
    : "0.00";

  const passRate = formatPercent(
    scores.filter((item) => item.scoreValue >= PASSING_SCORE).length,
    scores.length,
  );
  const attendanceRate = formatPercent(
    attendancePresentLike,
    attendance.length,
  );

  const reportMetrics: ReportMetric[] = [
    {
      label: "Tổng học sinh",
      value: `${students.length}`,
      trend: "Thời gian thực",
      note: "Số lượng học sinh trong dữ liệu hệ thống",
    },
    {
      label: "Tổng giáo viên",
      value: `${teachers.length}`,
      trend: "Thời gian thực",
      note: "Nguồn từ module quản lý giáo viên",
    },
    {
      label: "Điểm trung bình",
      value: averageScore,
      trend: passRate,
      note: "Tính trên toàn bộ đầu điểm hiện có",
    },
    {
      label: "Tỉ lệ điểm danh",
      value: attendanceRate,
      trend: `${attendance.length} bản ghi`,
      note: "Bao gồm có mặt, đi muộn, có phép",
    },
    {
      label: "Lớp đang quản lý",
      value: `${classes.length}`,
      trend: `${assignments.length} phân công`,
      note: "Quy mô lớp và tải giảng dạy",
    },
    {
      label: "Đợt kiểm tra",
      value: `${exams.length}`,
      trend: `${subjects.length} môn học`,
      note: "Tổng hợp lịch kiểm tra toàn trường",
    },
  ];

  const examTimelineMap = new Map<string, number>();
  exams.forEach((item) => {
    if (item.examDate.length === 0) {
      return;
    }
    const label = monthLabel(item.examDate);
    examTimelineMap.set(label, (examTimelineMap.get(label) ?? 0) + 1);
  });

  const examTimeline: TrendPoint[] = [...examTimelineMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => {
      const [monthA, yearA] = a.label
        .split("/")
        .map((item) => Number.parseInt(item, 10));
      const [monthB, yearB] = b.label
        .split("/")
        .map((item) => Number.parseInt(item, 10));
      const validA = Number.isFinite(monthA) && Number.isFinite(yearA);
      const validB = Number.isFinite(monthB) && Number.isFinite(yearB);
      if (!validA || !validB) {
        return a.label.localeCompare(b.label);
      }
      return yearA === yearB ? monthA - monthB : yearA - yearB;
    })
    .slice(-8);

  const examDateById = new Map<string, string>();
  exams.forEach((item) => {
    if (item.examId.length > 0) {
      examDateById.set(item.examId, item.examDate);
    }
  });

  const scoreByExam = new Map<string, { total: number; count: number }>();
  scores.forEach((item) => {
    if (item.examId.length === 0) {
      return;
    }
    const current = scoreByExam.get(item.examId) ?? { total: 0, count: 0 };
    current.total += item.scoreValue;
    current.count += 1;
    scoreByExam.set(item.examId, current);
  });

  const scoreTimeline: TrendPoint[] = [...scoreByExam.entries()]
    .map(([examId, aggregate]) => ({
      label: monthLabel(examDateById.get(examId) ?? ""),
      value:
        aggregate.count > 0
          ? Number.parseFloat((aggregate.total / aggregate.count).toFixed(2))
          : 0,
    }))
    .sort((a, b) => {
      const [monthA, yearA] = a.label
        .split("/")
        .map((item) => Number.parseInt(item, 10));
      const [monthB, yearB] = b.label
        .split("/")
        .map((item) => Number.parseInt(item, 10));
      const validA = Number.isFinite(monthA) && Number.isFinite(yearA);
      const validB = Number.isFinite(monthB) && Number.isFinite(yearB);
      if (!validA || !validB) {
        return a.label.localeCompare(b.label);
      }
      return yearA === yearB ? monthA - monthB : yearA - yearB;
    })
    .slice(-8);

  const absencesByClass = new Map<string, number>();
  attendance.forEach((item) => {
    if (item.status !== "ABSENT") {
      return;
    }
    absencesByClass.set(
      item.className,
      (absencesByClass.get(item.className) ?? 0) + 1,
    );
  });

  const highRiskClasses = [...absencesByClass.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const lowScoreClasses = classPerformance
    .filter((item) => Number.parseFloat(item.averageScore) < 5.5)
    .sort(
      (a, b) =>
        Number.parseFloat(a.averageScore) - Number.parseFloat(b.averageScore),
    )
    .slice(0, 4);

  const riskAlerts: RiskAlertItem[] = [
    ...highRiskClasses.map(([className, count]) => ({
      title: `Cảnh báo vắng học lớp ${className}`,
      detail: `${count} bản ghi vắng trong dữ liệu điểm danh`,
      severity: "high" as const,
    })),
    ...lowScoreClasses.map((item) => ({
      title: `Cần theo dõi học lực lớp ${item.className}`,
      detail: `Điểm trung bình hiện tại ${item.averageScore}, tỉ lệ đạt ${item.passRate}`,
      severity: "medium" as const,
    })),
  ];

  if (riskAlerts.length === 0) {
    riskAlerts.push({
      title: "Không có cảnh báo nghiêm trọng",
      detail: "Dữ liệu hiện tại không ghi nhận lớp vượt ngưỡng rủi ro",
      severity: "low",
    });
  }

  return {
    reportMetrics,
    conductDistribution,
    academicRankDistribution,
    scoreStatusDistribution,
    genderDistribution,
    attendanceDistribution,
    classPerformance,
    teacherLoad,
    subjectLoad,
    departmentLoad,
    topStudents,
    examTimeline,
    scoreTimeline,
    riskAlerts,
    reportExports: buildReportExports(),
  };
}

const CACHE_KEY = "edu_analytics_snapshot_v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedSnapshot = {
  snapshot: EducationAnalyticsSnapshot;
  cachedAt: number;
};

function readCache(): EducationAnalyticsSnapshot | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSnapshot;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.snapshot;
  } catch {
    return null;
  }
}

function writeCache(snapshot: EducationAnalyticsSnapshot) {
  try {
    const payload: CachedSnapshot = { snapshot, cachedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage quota exceeded — ignore
  }
}

function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

export function useEducationAnalytics() {
  const cached = useMemo(() => readCache(), []);

  const [snapshot, setSnapshot] = useState<EducationAnalyticsSnapshot>(
    cached ?? emptySnapshot(),
  );
  // Always start as not-loading — load is triggered explicitly via triggerLoad/refresh
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // hasLoaded = true means we already have data (from cache or a completed fetch)
  const [hasLoaded, setHasLoaded] = useState(Boolean(cached));

  const load = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
      clearCache();
    } else {
      setIsLoading(true);
    }
    setError(null);
    setHasLoaded(true);

    try {
      // Phase 1: lightweight — students, teachers, classes (render metrics fast)
      const [studentResult, teacherResult, classResult] =
        await Promise.allSettled([
          studentApi.list({ scope: "all" }),
          teacherApi.list(),
          classroomApi.list({ scope: "all" }),
        ]);

      const students = mapStudents(settleData(studentResult, []));
      const teachers = mapTeachers(settleData(teacherResult, []));
      const classes = mapClasses(settleData(classResult, []));

      // Render partial snapshot immediately so metrics appear fast
      setSnapshot(
        buildSnapshot({
          students,
          teachers,
          classes,
          subjects: [],
          assignments: [],
          scores: [],
          attendance: [],
          exams: [],
        }),
      );
      setIsLoading(false);

      // Priority 2: heavier data — scores, exams, attendance, assignments, subjects
      const [
        subjectResult,
        assignmentResult,
        scoreResult,
        attendanceResult,
        examResult,
      ] = await Promise.allSettled([
        subjectApi.list(),
        teachingApi.list(),
        scoreApi.list(),
        attendanceApi.list(),
        examApi.list(),
      ]);

      const subjects = mapSubjects(settleData(subjectResult, []));
      const assignments = mapAssignments(settleData(assignmentResult, []));
      const scores = mapScores(settleData(scoreResult, []));
      const attendance = mapAttendance(settleData(attendanceResult, []));
      const exams = mapExams(settleData(examResult, []));

      const fullSnapshot = buildSnapshot({
        students,
        teachers,
        classes,
        subjects,
        assignments,
        scores,
        attendance,
        exams,
      });

      setSnapshot(fullSnapshot);
      writeCache(fullSnapshot);

      const rejectedCount = [
        studentResult,
        teacherResult,
        classResult,
        subjectResult,
        assignmentResult,
        scoreResult,
        attendanceResult,
        examResult,
      ].filter((item) => item.status === "rejected").length;

      if (rejectedCount > 0) {
        setError(
          `Một số nguồn dữ liệu không truy cập được (${rejectedCount}/8). Hệ thống đã hiển thị phần dữ liệu có sẵn.`,
        );
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không tải được dữ liệu dashboard",
      );
      setSnapshot(emptySnapshot());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Do NOT auto-load on mount — let the page decide when to trigger
  // (page calls triggerLoad on first render if desired)

  const triggerLoad = useCallback(() => {
    if (!hasLoaded) {
      void load(false);
    }
  }, [hasLoaded, load]);

  return useMemo(
    () => ({
      snapshot,
      isLoading,
      isRefreshing,
      hasLoaded,
      error,
      refresh: () => load(true),
      triggerLoad,
    }),
    [error, hasLoaded, isLoading, isRefreshing, load, snapshot, triggerLoad],
  );
}
