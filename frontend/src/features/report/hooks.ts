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
    const key = item.trim().length > 0 ? item.trim() : "Khac";
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
    return "Gioi";
  }
  if (score >= 6.5) {
    return "Kha";
  }
  if (score >= 5) {
    return "Trung binh";
  }
  return "Can ho tro";
}

function normalizeConduct(input: string) {
  const normalized = input.trim().toUpperCase();
  if (["EXCELLENT", "TOT", "TOT"].includes(normalized)) {
    return "Tot";
  }
  if (["GOOD", "KHA"].includes(normalized)) {
    return "Kha";
  }
  if (["AVERAGE", "TRUNG BINH"].includes(normalized)) {
    return "Trung binh";
  }
  if (["POOR", "YEU"].includes(normalized)) {
    return "Yeu";
  }
  return input.trim().length > 0 ? input : "Chua cap nhat";
}

function normalizeGender(input: string) {
  const normalized = input.trim().toUpperCase();
  if (["MALE", "NAM"].includes(normalized)) {
    return "Nam";
  }
  if (["FEMALE", "NU"].includes(normalized)) {
    return "Nu";
  }
  return "Khac";
}

function normalizeScoreStatus(input: string) {
  const normalized = input.trim().toUpperCase();
  if (normalized.length === 0) {
    return "Khong ro";
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
    return "Khong ro";
  }
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function buildReportExports(): ReportExportItem[] {
  return [
    {
      reportName: "Bao cao hoc luc tong hop",
      scope: "Toan truong theo nam hoc",
      format: "PDF / Excel",
      source: "students + scores + classes",
    },
    {
      reportName: "Thong ke diem danh",
      scope: "Theo lop, hoc ky, thang",
      format: "PDF / Dashboard",
      source: "attendance + classes",
    },
    {
      reportName: "Tai giang day giao vien",
      scope: "Theo giao vien / bo mon",
      format: "Excel",
      source: "teachers + teaching-assignments",
    },
    {
      reportName: "Theo doi ky thi va ket qua",
      scope: "Theo mon hoc / dot thi",
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

function settleData<T>(result: PromiseSettledResult<{ data: T }>, fallback: T): T {
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
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      studentCode: asString(record.studentCode, "HS-NA"),
      fullName: asString(record.fullName, "Hoc sinh"),
      className: asString(record.className, "Chua phan lop"),
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
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      teacherCode: asString(record.teacherCode, "GV-NA"),
      fullName: asString(record.fullName, "Giao vien"),
      department: asString(record.department, "Chua cap nhat"),
      homeroomClass: asString(record.homeroomClass, "Khong co"),
    };
  });
}

function mapClasses(raw: unknown): ClassLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      classCode: asString(record.classCode, "CLS-NA"),
      className: asString(record.className, "Lop"),
      academicYear: asString(record.academicYear, "N/A"),
      homeroomTeacher: asString(record.homeroomTeacher, "Chua cap nhat"),
      totalStudents: parseNumber(record.totalStudents),
    };
  });
}

function mapSubjects(raw: unknown): SubjectLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      code: asString(record.code, "SUB-NA"),
      name: asString(record.name, "Mon hoc"),
      departmentName: asString(record.departmentName, "Khac"),
    };
  });
}

function mapAssignments(raw: unknown): AssignmentLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      teacherCode: asString(record.teacherCode, ""),
      classCode: asString(record.classCode, ""),
      subjectCode: asString(record.subjectCode, ""),
      subjectName: asString(record.subjectName, "Chua cap nhat"),
    };
  });
}

function mapScores(raw: unknown): ScoreLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
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
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      className: asString(record.className, "Chua ro lop"),
      status: normalizeAttendanceStatus(asString(record.status, "")),
    };
  });
}

function mapExams(raw: unknown): ExamLite[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    return {
      examId: asString(record.examId, ""),
      examDate: asString(record.examDate, ""),
      title: asString(record.title, "Bai kiem tra"),
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

  const classPerformance: ClassPerformanceItem[] = classes.map((item) => {
    const classStudents = students.filter((student) => student.className === item.className);
    const averageScore = classStudents.length
      ? classStudents.reduce((sum, student) => sum + student.scoreAverage, 0) / classStudents.length
      : 0;
    const passCount = classStudents.filter((student) => student.scoreAverage >= PASSING_SCORE).length;
    return {
      className: item.className,
      academicYear: item.academicYear,
      totalStudents: classStudents.length > 0 ? classStudents.length : item.totalStudents,
      averageScore: averageScore.toFixed(2),
      passRate: formatPercent(passCount, classStudents.length),
      homeroomTeacher: item.homeroomTeacher,
    };
  }).sort((a, b) => Number.parseFloat(b.averageScore) - Number.parseFloat(a.averageScore));

  const teacherAssignmentMap = new Map<string, number>();
  assignments.forEach((item) => {
    if (item.teacherCode.length === 0) {
      return;
    }
    teacherAssignmentMap.set(item.teacherCode, (teacherAssignmentMap.get(item.teacherCode) ?? 0) + 1);
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

  const subjectStats = new Map<string, { name: string; assignmentCount: number; teachers: Set<string>; classes: Set<string> }>();
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
    current.assignmentCount += teacherAssignmentMap.get(teacher.teacherCode) ?? 0;
    departmentLoadMap.set(teacher.department, current);
  });

  const departmentLoad = [...departmentLoadMap.values()].sort((a, b) => b.assignmentCount - a.assignmentCount);

  const conductDistribution = toDistributionItems(toDistributionMap(students.map((item) => item.conduct)));

  const academicRankDistribution = toDistributionItems(
    toDistributionMap(students.map((item) => classifyAcademicRank(item.scoreAverage))),
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

  const attendancePresentLike = attendance.filter((item) => ["PRESENT", "LATE", "EXCUSED"].includes(item.status)).length;

  const averageScore = scores.length
    ? (scores.reduce((sum, item) => sum + item.scoreValue, 0) / scores.length).toFixed(2)
    : "0.00";

  const passRate = formatPercent(scores.filter((item) => item.scoreValue >= PASSING_SCORE).length, scores.length);
  const attendanceRate = formatPercent(attendancePresentLike, attendance.length);

  const reportMetrics: ReportMetric[] = [
    {
      label: "Tong hoc sinh",
      value: `${students.length}`,
      trend: "Realtime",
      note: "So luong hoc sinh trong du lieu he thong",
    },
    {
      label: "Tong giao vien",
      value: `${teachers.length}`,
      trend: "Realtime",
      note: "Nguon tu module quan ly giao vien",
    },
    {
      label: "Diem trung binh",
      value: averageScore,
      trend: passRate,
      note: "Tinh tren toan bo dau diem hien co",
    },
    {
      label: "Ti le diem danh",
      value: attendanceRate,
      trend: `${attendance.length} ban ghi`,
      note: "Bao gom present, late, excused",
    },
    {
      label: "Lop dang quan ly",
      value: `${classes.length}`,
      trend: `${assignments.length} phan cong`,
      note: "Quy mo lop va tai giang day",
    },
    {
      label: "Dot kiem tra",
      value: `${exams.length}`,
      trend: `${subjects.length} mon hoc`,
      note: "Tong hop lich kiem tra toan truong",
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
      const [monthA, yearA] = a.label.split("/").map((item) => Number.parseInt(item, 10));
      const [monthB, yearB] = b.label.split("/").map((item) => Number.parseInt(item, 10));
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
      value: aggregate.count > 0 ? Number.parseFloat((aggregate.total / aggregate.count).toFixed(2)) : 0,
    }))
    .sort((a, b) => {
      const [monthA, yearA] = a.label.split("/").map((item) => Number.parseInt(item, 10));
      const [monthB, yearB] = b.label.split("/").map((item) => Number.parseInt(item, 10));
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
    absencesByClass.set(item.className, (absencesByClass.get(item.className) ?? 0) + 1);
  });

  const highRiskClasses = [...absencesByClass.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const lowScoreClasses = classPerformance
    .filter((item) => Number.parseFloat(item.averageScore) < 5.5)
    .sort((a, b) => Number.parseFloat(a.averageScore) - Number.parseFloat(b.averageScore))
    .slice(0, 4);

  const riskAlerts: RiskAlertItem[] = [
    ...highRiskClasses.map(([className, count]) => ({
      title: `Canh bao vang hoc lop ${className}`,
      detail: `${count} ban ghi vang trong du lieu diem danh`,
      severity: "high" as const,
    })),
    ...lowScoreClasses.map((item) => ({
      title: `Can theo doi hoc luc lop ${item.className}`,
      detail: `Diem trung binh hien tai ${item.averageScore}, ti le dat ${item.passRate}`,
      severity: "medium" as const,
    })),
  ];

  if (riskAlerts.length === 0) {
    riskAlerts.push({
      title: "Khong co canh bao nghiem trong",
      detail: "Du lieu hien tai khong ghi nhan lop vuot nguong rui ro",
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

export function useEducationAnalytics() {
  const [snapshot, setSnapshot] = useState<EducationAnalyticsSnapshot>(emptySnapshot());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [
        studentResult,
        teacherResult,
        classResult,
        subjectResult,
        assignmentResult,
        scoreResult,
        attendanceResult,
        examResult,
      ] = await Promise.allSettled([
        studentApi.list({ scope: "all" }),
        teacherApi.list(),
        classroomApi.list({ scope: "all" }),
        subjectApi.list(),
        teachingApi.list(),
        scoreApi.list(),
        attendanceApi.list(),
        examApi.list(),
      ]);

      const students = mapStudents(settleData(studentResult, []));
      const teachers = mapTeachers(settleData(teacherResult, []));
      const classes = mapClasses(settleData(classResult, []));
      const subjects = mapSubjects(settleData(subjectResult, []));
      const assignments = mapAssignments(settleData(assignmentResult, []));
      const scores = mapScores(settleData(scoreResult, []));
      const attendance = mapAttendance(settleData(attendanceResult, []));
      const exams = mapExams(settleData(examResult, []));

      setSnapshot(
        buildSnapshot({
          students,
          teachers,
          classes,
          subjects,
          assignments,
          scores,
          attendance,
          exams,
        }),
      );

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
        setError(`Mot so nguon du lieu khong truy cap duoc (${rejectedCount}/8). He thong da hien thi phan du lieu co san.`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Khong tai duoc dashboard bao cao");
      setSnapshot(emptySnapshot());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  return useMemo(
    () => ({
      snapshot,
      isLoading,
      isRefreshing,
      error,
      refresh: () => load(true),
    }),
    [error, isLoading, isRefreshing, load, snapshot],
  );
}
