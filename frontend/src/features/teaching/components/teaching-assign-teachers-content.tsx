"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { Panel } from "@/shared/ui/panel";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/components/toast-provider";
import { useAuthSession } from "@/hooks/use-auth-session";
import { teacherApi } from "@/features/teacher/api";
import { subjectApi } from "@/features/subject/api";
import { classroomApi } from "@/features/classroom/api";
import {
  teachingApi,
  type TeachingAssignmentUpsertPayload,
  type TimetableEntryPayload,
} from "@/features/teaching/api";

type GradeLevel = "10" | "11" | "12";

type TeacherOption = {
  code: string;
  name: string;
};

type SubjectOption = {
  code: string;
  name: string;
};

type ClassByGrade = {
  code: string;
  name: string;
};

type YearOption = {
  code: string;
  name: string;
};

type DuplicateConflict = {
  teacherCode: string;
  teacherName: string;
  subjectCode: string;
  dayOfWeek: number;
  periodStart: number;
  periodEnd: number;
  affectedClasses: string[];
};

type ClassRow = {
  code: string;
  name: string;
  grade: GradeLevel;
};

type TeacherInsight = {
  totalPeriods: number;
  classes: string[];
  conflicts: string[];
};

type HoveredTeacher = {
  code: string;
  x: number;
  y: number;
};

const DAYS_LABEL: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

function toYearCode(raw?: string) {
  if (!raw) {
    return "";
  }
  const text = raw.trim();
  const match = text.match(/(\d{4})\s*[-/]\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return text.toUpperCase();
}

function parseGrade(classCode?: string, grade?: string) {
  const fromGrade = (grade ?? "").match(/10|11|12/);
  if (fromGrade) {
    return fromGrade[0] as GradeLevel;
  }

  const fromClassCode = (classCode ?? "").trim().match(/^(10|11|12)/);
  if (fromClassCode) {
    return fromClassCode[1] as GradeLevel;
  }

  return null;
}

export function TeachingAssignTeachersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { session } = useAuthSession();

  const isAuthorized =
    session?.user.role === "ADMIN" ||
    (session?.user.role === "TEACHER" &&
      (session.user.departmentLevel === 1 ||
        session.user.departmentLevel === 2));
  const isDepartmentManager =
    session?.user.role === "TEACHER" &&
    (session.user.departmentLevel === 1 || session.user.departmentLevel === 2);
  const currentDepartmentCode = (session?.user.departmentCode ?? "")
    .trim()
    .toUpperCase();

  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [yearOptions, setYearOptions] = useState<YearOption[]>([]);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [classQuery, setClassQuery] = useState("");

  const [classesByGrade, setClassesByGrade] = useState<
    Record<GradeLevel, ClassByGrade[]>
  >({
    "10": [],
    "11": [],
    "12": [],
  });
  const [subjectTimetableByClass, setSubjectTimetableByClass] = useState<
    Record<string, TimetableEntryPayload[]>
  >({});

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [notesByClass, setNotesByClass] = useState<Record<string, string>>({});
  const [existingAssignmentIds, setExistingAssignmentIds] = useState<
    Record<string, string>
  >({});
  const [duplicateConflicts, setDuplicateConflicts] = useState<
    DuplicateConflict[]
  >([]);
  const [missingTimetableClasses, setMissingTimetableClasses] = useState<
    string[]
  >([]);
  const [inlineIssuesByClass, setInlineIssuesByClass] = useState<
    Record<string, string[]>
  >({});
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [hoveredTeacher, setHoveredTeacher] = useState<HoveredTeacher | null>(
    null,
  );
  const [liveCheckError, setLiveCheckError] = useState("");
  const [isLiveChecking, setIsLiveChecking] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const allClasses = useMemo(() => {
    return [
      ...classesByGrade["10"],
      ...classesByGrade["11"],
      ...classesByGrade["12"],
    ];
  }, [classesByGrade]);

  const filteredClassesByGrade = useMemo(() => {
    const query = classQuery.trim().toUpperCase();
    if (!query) {
      return classesByGrade;
    }

    return {
      "10": classesByGrade["10"].filter(
        (item) =>
          item.code.includes(query) || item.name.toUpperCase().includes(query),
      ),
      "11": classesByGrade["11"].filter(
        (item) =>
          item.code.includes(query) || item.name.toUpperCase().includes(query),
      ),
      "12": classesByGrade["12"].filter(
        (item) =>
          item.code.includes(query) || item.name.toUpperCase().includes(query),
      ),
    } satisfies Record<GradeLevel, ClassByGrade[]>;
  }, [classQuery, classesByGrade]);

  const classRows = useMemo(() => {
    return (["10", "11", "12"] as GradeLevel[])
      .flatMap((grade) =>
        filteredClassesByGrade[grade].map((item) => ({
          code: item.code,
          name: item.name,
          grade,
        })),
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredClassesByGrade]);

  const assignmentProgress = useMemo(() => {
    const total = allClasses.length;
    const assigned = allClasses.reduce((count, classItem) => {
      const key = classItem.code;
      return (assignments[key] ?? "").trim() ? count + 1 : count;
    }, 0);

    return {
      total,
      assigned,
      unassigned: Math.max(total - assigned, 0),
      completionRate: total === 0 ? 0 : Math.round((assigned / total) * 100),
    };
  }, [allClasses, assignments]);

  const teacherNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    teacherOptions.forEach((teacher) => {
      map.set(teacher.code, teacher.name);
    });
    return map;
  }, [teacherOptions]);

  const classPeriodCountByCode = useMemo(() => {
    const periodMap: Record<string, number> = {};

    Object.entries(subjectTimetableByClass).forEach(([classCode, slots]) => {
      periodMap[classCode] = slots.reduce((total, slot) => {
        const periods = Math.max(
          (slot.periodEnd ?? 0) - (slot.periodStart ?? 0) + 1,
          0,
        );
        return total + periods;
      }, 0);
    });

    return periodMap;
  }, [subjectTimetableByClass]);

  const teacherInsights = useMemo(() => {
    const insights: Record<string, TeacherInsight> = {};

    Object.entries(assignments).forEach(([classCode, teacherCodeRaw]) => {
      const teacherCode = teacherCodeRaw.trim().toUpperCase();
      if (!teacherCode) {
        return;
      }

      if (!insights[teacherCode]) {
        insights[teacherCode] = {
          totalPeriods: 0,
          classes: [],
          conflicts: [],
        };
      }

      const classPeriods = classPeriodCountByCode[classCode] ?? 0;
      insights[teacherCode].totalPeriods += classPeriods;
      insights[teacherCode].classes.push(classCode);
    });

    duplicateConflicts.forEach((conflict) => {
      const teacherCode = (conflict.teacherCode ?? "").trim().toUpperCase();
      if (!teacherCode) {
        return;
      }

      if (!insights[teacherCode]) {
        insights[teacherCode] = {
          totalPeriods: 0,
          classes: [],
          conflicts: [],
        };
      }

      const dayLabel =
        DAYS_LABEL[conflict.dayOfWeek] ?? `Thứ ${conflict.dayOfWeek}`;
      const conflictText = `${dayLabel} tiết ${conflict.periodStart}-${conflict.periodEnd}: ${conflict.affectedClasses.join(", ")}`;
      insights[teacherCode].conflicts.push(conflictText);
    });

    Object.values(insights).forEach((insight) => {
      insight.classes = Array.from(new Set(insight.classes)).sort((a, b) =>
        a.localeCompare(b),
      );
      insight.conflicts = Array.from(new Set(insight.conflicts));
    });

    return insights;
  }, [assignments, classPeriodCountByCode, duplicateConflicts]);

  const hasAnyIssue =
    missingTimetableClasses.length > 0 || duplicateConflicts.length > 0;

  useEffect(() => {
    const urlAcademicYear = toYearCode(
      searchParams.get("academicYear") ?? undefined,
    );
    const urlSemester = (searchParams.get("semester") ?? "")
      .trim()
      .toUpperCase();
    const urlSubject = (searchParams.get("subject") ?? "").trim().toUpperCase();

    if (urlAcademicYear) {
      setSelectedAcademicYear(urlAcademicYear);
    }
    if (urlSemester === "HK1" || urlSemester === "HK2") {
      setSelectedSemester(urlSemester);
    }
    if (urlSubject) {
      setSelectedSubject(urlSubject);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      try {
        const [subjectsRes, teachersRes, classesRes] = await Promise.all([
          subjectApi.list(),
          teacherApi.list({ departmentQuery: session?.user.departmentCode }),
          classroomApi.list({ scope: "all" }),
        ]);

        const subjects = Array.isArray(subjectsRes.data)
          ? subjectsRes.data
          : [];
        const teachers = Array.isArray(teachersRes.data)
          ? teachersRes.data
          : [];
        const classes = Array.isArray(classesRes.data) ? classesRes.data : [];

        const visibleSubjects =
          isDepartmentManager && currentDepartmentCode
            ? subjects.filter(
                (s) =>
                  (s.departmentCode ?? "").trim().toUpperCase() ===
                  currentDepartmentCode,
              )
            : subjects;

        setSubjectOptions(
          visibleSubjects
            .filter((s) => (s.code ?? "").trim().length > 0)
            .map((s) => ({
              code: (s.code ?? "").trim().toUpperCase(),
              name: (s.name ?? s.code ?? "").trim(),
            })),
        );

        setTeacherOptions(
          teachers
            .filter((t) => (t.teacherCode ?? "").trim().length > 0)
            .map((t) => ({
              code: (t.teacherCode ?? "").trim().toUpperCase(),
              name: (t.fullName ?? t.teacherCode ?? "").trim(),
            })),
        );

        const yearSet = new Set<string>();
        classes.forEach((item) => {
          const yearCode = toYearCode(item.academicYear);
          if (yearCode) {
            yearSet.add(yearCode);
          }
        });

        const currentYear = new Date().getFullYear();
        const currentYearCode = `${currentYear}-${currentYear + 1}`;
        if (!yearSet.has(currentYearCode)) {
          yearSet.add(currentYearCode);
        }

        const years = Array.from(yearSet)
          .sort((a, b) => b.localeCompare(a))
          .map((code) => ({
            code,
            name: `Năm học ${code}`,
          }));

        setYearOptions(years);
        if (!selectedAcademicYear) {
          const preferred =
            years.find((item) => item.code === currentYearCode)?.code ??
            years[0]?.code ??
            "";
          setSelectedAcademicYear(preferred);
        }
      } catch {
        showToast("Lỗi tải dữ liệu màn phân công", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    isAuthorized,
    isDepartmentManager,
    currentDepartmentCode,
    selectedAcademicYear,
    session?.user.departmentCode,
    showToast,
  ]);

  useEffect(() => {
    if (
      !isAuthorized ||
      !selectedAcademicYear ||
      !selectedSemester ||
      !selectedSubject
    ) {
      setClassesByGrade({ "10": [], "11": [], "12": [] });
      setSubjectTimetableByClass({});
      return;
    }

    void (async () => {
      try {
        const [classesRes, timetableRes] = await Promise.all([
          classroomApi.list({ scope: "all" }),
          teachingApi.getTimetableGrid(selectedSemester, selectedAcademicYear),
        ]);

        const classes = Array.isArray(classesRes.data) ? classesRes.data : [];
        const timetable = Array.isArray(timetableRes.data)
          ? timetableRes.data
          : [];
        const classMetaByCode = new Map(
          classes
            .map((item) => ({
              code: (item.classCode ?? "").trim().toUpperCase(),
              name: (item.className ?? "").trim(),
              grade: (item.grade ?? "").trim(),
            }))
            .filter((item) => item.code)
            .map((item) => [item.code, item] as const),
        );
        const classCodesWithSelectedSubject = new Set(
          timetable
            .filter(
              (item) =>
                (item.subjectCode ?? "").trim().toUpperCase() ===
                selectedSubject,
            )
            .map((item) => (item.classCode ?? "").trim().toUpperCase())
            .filter(Boolean),
        );
        const nextTimetableByClass: Record<string, TimetableEntryPayload[]> =
          {};

        timetable
          .filter(
            (item) =>
              (item.subjectCode ?? "").trim().toUpperCase() === selectedSubject,
          )
          .forEach((item) => {
            const classCode = (item.classCode ?? "").trim().toUpperCase();
            if (!classCode) {
              return;
            }

            if (!nextTimetableByClass[classCode]) {
              nextTimetableByClass[classCode] = [];
            }

            nextTimetableByClass[classCode].push({
              classCode,
              subjectCode: selectedSubject,
              dayOfWeek: Number(item.dayOfWeek ?? 0),
              periodStart: Number(item.periodStart ?? 0),
              periodEnd: Number(item.periodEnd ?? 0),
            });
          });
        const next: Record<GradeLevel, ClassByGrade[]> = {
          "10": [],
          "11": [],
          "12": [],
        };

        Array.from(classCodesWithSelectedSubject)
          .sort((a, b) => a.localeCompare(b))
          .forEach((classCode) => {
            const classMeta = classMetaByCode.get(classCode);
            const grade = parseGrade(classCode, classMeta?.grade);
            if (!grade) {
              return;
            }

            next[grade].push({
              code: classCode,
              name: (classMeta?.name ?? classCode).trim(),
            });
          });

        setClassesByGrade(next);
        setSubjectTimetableByClass(nextTimetableByClass);
      } catch {
        showToast("Lỗi tải danh sách lớp", "error");
      }
    })();
  }, [
    isAuthorized,
    selectedAcademicYear,
    selectedSemester,
    selectedSubject,
    showToast,
  ]);

  useEffect(() => {
    setAssignments({});
    setNotesByClass({});
    setExistingAssignmentIds({});
    setCanSave(false);
    setDuplicateConflicts([]);
    setMissingTimetableClasses([]);
    setInlineIssuesByClass({});
    setLiveCheckError("");
  }, [selectedAcademicYear, selectedSemester, selectedSubject]);

  useEffect(() => {
    if (hasAnyIssue) {
      setShowIssueModal(true);
      return;
    }

    setShowIssueModal(false);
  }, [hasAnyIssue]);

  useEffect(() => {
    if (
      !isAuthorized ||
      !selectedAcademicYear ||
      !selectedSemester ||
      !selectedSubject ||
      allClasses.length === 0
    ) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await teachingApi.listBySubject(selectedSubject, {
          semesterCode: selectedSemester,
          academicYearCode: selectedAcademicYear,
        });

        if (cancelled) {
          return;
        }

        const rows = Array.isArray(response.data) ? response.data : [];
        const availableClassCodes = new Set(
          allClasses.map((item) => item.code),
        );
        const allowedTeacherCodes = new Set(
          teacherOptions.map((item) => item.code),
        );
        const nextAssignments: Record<string, string> = {};
        const nextNotes: Record<string, string> = {};
        const nextExistingIds: Record<string, string> = {};
        let outOfDepartmentAssignments = 0;

        rows.forEach((row) => {
          const classCode = (row.classCode ?? "").trim().toUpperCase();
          const teacherCode = (row.teacherCode ?? "").trim().toUpperCase();
          if (
            !classCode ||
            !teacherCode ||
            !availableClassCodes.has(classCode)
          ) {
            return;
          }

          if (isDepartmentManager && !allowedTeacherCodes.has(teacherCode)) {
            outOfDepartmentAssignments += 1;
            return;
          }

          const key = classCode;
          nextAssignments[key] = teacherCode;
          nextNotes[key] = (row.note ?? "").trim();

          const assignmentId = (row.assignmentId ?? "").trim();
          if (assignmentId) {
            nextExistingIds[key] = assignmentId;
          }
        });

        setAssignments(nextAssignments);
        setNotesByClass(nextNotes);
        setExistingAssignmentIds(nextExistingIds);
        setCanSave(false);
        setDuplicateConflicts([]);
        setMissingTimetableClasses([]);
        setInlineIssuesByClass({});
        setLiveCheckError("");

        if (outOfDepartmentAssignments > 0) {
          showToast(
            `Có ${outOfDepartmentAssignments} phân công cũ dùng giáo viên ngoài bộ môn đã được ẩn để bạn phân công lại đúng phạm vi.`,
            "info",
          );
        }
      } catch {
        if (!cancelled) {
          showToast("Lỗi tải phân công đã có", "error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthorized,
    selectedAcademicYear,
    selectedSemester,
    selectedSubject,
    allClasses,
    teacherOptions,
    isDepartmentManager,
    showToast,
  ]);

  const selectedAssignments = useMemo(() => {
    return allClasses
      .map((classItem) => {
        const teacherCode = (assignments[classItem.code] ?? "")
          .trim()
          .toUpperCase();
        return {
          classCode: classItem.code,
          teacherCode,
        };
      })
      .filter((item) => item.teacherCode);
  }, [allClasses, assignments]);

  const areAllClassesAssigned = useMemo(() => {
    if (allClasses.length === 0) {
      return false;
    }

    return allClasses.every(
      (classItem) => (assignments[classItem.code] ?? "").trim().length > 0,
    );
  }, [allClasses, assignments]);

  useEffect(() => {
    if (
      !isAuthorized ||
      !selectedAcademicYear ||
      !selectedSemester ||
      !selectedSubject
    ) {
      setInlineIssuesByClass({});
      setDuplicateConflicts([]);
      setMissingTimetableClasses([]);
      setCanSave(false);
      return;
    }

    if (selectedAssignments.length === 0) {
      setInlineIssuesByClass({});
      setDuplicateConflicts([]);
      setMissingTimetableClasses([]);
      setCanSave(false);
      setLiveCheckError("");
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          setIsLiveChecking(true);
          setLiveCheckError("");

          const response = await teachingApi.checkConflicts({
            semesterCode: selectedSemester,
            academicYearCode: selectedAcademicYear,
            subjectCode: selectedSubject,
            assignments: selectedAssignments,
          });

          if (cancelled) {
            return;
          }

          const result = response.data;
          const missing = Array.isArray(result?.missingTimetableClasses)
            ? result.missingTimetableClasses
            : [];
          const conflictsRaw = Array.isArray(result?.conflicts)
            ? result.conflicts
            : [];
          const issuesByClass: Record<string, string[]> = {};

          missing.forEach((classCode) => {
            if (!issuesByClass[classCode]) {
              issuesByClass[classCode] = [];
            }
            issuesByClass[classCode].push(
              "Chưa có thời khóa biểu cho lớp và môn này.",
            );
          });

          const conflicts: DuplicateConflict[] = conflictsRaw.map((item) => ({
            teacherCode: item.teacherCode ?? "",
            teacherName: item.teacherName ?? item.teacherCode ?? "",
            subjectCode: item.subjectCode ?? selectedSubject,
            dayOfWeek: Number(item.dayOfWeek ?? 0),
            periodStart: Number(item.periodStart ?? 0),
            periodEnd: Number(item.periodEnd ?? 0),
            affectedClasses: Array.isArray(item.affectedClasses)
              ? item.affectedClasses
              : [],
          }));

          conflicts.forEach((conflict) => {
            const dayLabel =
              DAYS_LABEL[conflict.dayOfWeek] ?? `Thứ ${conflict.dayOfWeek}`;
            conflict.affectedClasses.forEach((classCode) => {
              const relatedClasses = conflict.affectedClasses
                .filter((value) => value !== classCode)
                .join(", ");
              const conflictMessage = relatedClasses
                ? `Trùng lịch ${dayLabel} tiết ${conflict.periodStart}-${conflict.periodEnd} với lớp ${relatedClasses}.`
                : `Trùng lịch ${dayLabel} tiết ${conflict.periodStart}-${conflict.periodEnd}.`;

              if (!issuesByClass[classCode]) {
                issuesByClass[classCode] = [];
              }
              issuesByClass[classCode].push(conflictMessage);
            });
          });

          Object.keys(issuesByClass).forEach((classCode) => {
            issuesByClass[classCode] = Array.from(
              new Set(issuesByClass[classCode]),
            );
          });

          setInlineIssuesByClass(issuesByClass);
          setDuplicateConflicts(conflicts);
          setMissingTimetableClasses(missing);
          setCanSave(
            areAllClassesAssigned && Object.keys(issuesByClass).length === 0,
          );
        } catch {
          if (!cancelled) {
            setCanSave(false);
            setLiveCheckError(
              "Không thể kiểm tra trùng lịch tự động. Bạn có thể kiểm tra lại thủ công.",
            );
          }
        } finally {
          if (!cancelled) {
            setIsLiveChecking(false);
          }
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    isAuthorized,
    selectedAcademicYear,
    selectedSemester,
    selectedSubject,
    selectedAssignments,
    areAllClassesAssigned,
  ]);

  if (!isAuthorized) {
    return (
      <div className="grid gap-4">
        <PageIntro
          eyebrow="Teaching / Assign Teachers"
          title="Phân công giáo viên"
          description="Bạn không có quyền truy cập chức năng này."
          actions={
            <Link
              href="/teaching-assignments"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>
          }
        />
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Chỉ ADMIN hoặc tổ trưởng/tổ phó (departmentLevel 1-2) mới được phân
          công giáo viên.
        </Panel>
      </div>
    );
  }

  const handleTeacherChange = (classCode: string, teacherCode: string) => {
    setAssignments((prev) => ({
      ...prev,
      [classCode]: teacherCode,
    }));
    setCanSave(false);
  };

  const clearAllAssignments = () => {
    setAssignments({});
    setNotesByClass({});
    setCanSave(false);
    setDuplicateConflicts([]);
    setMissingTimetableClasses([]);
    setInlineIssuesByClass({});
    setLiveCheckError("");
  };

  const handleNoteChange = (classCode: string, note: string) => {
    setNotesByClass((prev) => ({
      ...prev,
      [classCode]: note,
    }));
  };

  const handleTeacherBadgeEnter = (
    teacherCode: string,
    x: number,
    y: number,
  ) => {
    setHoveredTeacher({ code: teacherCode, x, y });
  };

  const handleTeacherBadgeMove = (
    teacherCode: string,
    x: number,
    y: number,
  ) => {
    setHoveredTeacher((current) => {
      if (!current || current.code !== teacherCode) {
        return { code: teacherCode, x, y };
      }

      return { ...current, x, y };
    });
  };

  const handleTeacherBadgeLeave = () => {
    setHoveredTeacher(null);
  };

  async function checkDuplicate() {
    if (!selectedAcademicYear || !selectedSemester || !selectedSubject) {
      showToast("Vui lòng chọn năm học, học kỳ và môn", "error");
      return;
    }

    if (allClasses.length === 0) {
      showToast("Không có lớp để phân công", "error");
      return;
    }

    const pending = allClasses.map((classItem) => {
      const key = classItem.code;
      return {
        classCode: classItem.code,
        teacherCode: (assignments[key] ?? "").trim().toUpperCase(),
      };
    });

    if (pending.some((item) => !item.teacherCode)) {
      showToast("Vui lòng chọn giáo viên cho toàn bộ lớp", "error");
      return;
    }

    try {
      setIsLoading(true);
      const response = await teachingApi.checkConflicts({
        semesterCode: selectedSemester,
        academicYearCode: selectedAcademicYear,
        subjectCode: selectedSubject,
        assignments: pending,
      });

      const result = response.data;
      const missing = Array.isArray(result?.missingTimetableClasses)
        ? result.missingTimetableClasses
        : [];
      const conflictsRaw = Array.isArray(result?.conflicts)
        ? result.conflicts
        : [];

      const conflicts = conflictsRaw.map((item) => ({
        teacherCode: item.teacherCode ?? "",
        teacherName: item.teacherName ?? item.teacherCode ?? "",
        subjectCode: item.subjectCode ?? selectedSubject,
        dayOfWeek: Number(item.dayOfWeek ?? 0),
        periodStart: Number(item.periodStart ?? 0),
        periodEnd: Number(item.periodEnd ?? 0),
        affectedClasses: Array.isArray(item.affectedClasses)
          ? item.affectedClasses
          : [],
      }));

      setMissingTimetableClasses(missing);
      setDuplicateConflicts(conflicts);
      setCanSave(
        missing.length === 0 && conflicts.length === 0 && areAllClassesAssigned,
      );

      if (missing.length === 0 && conflicts.length === 0) {
        showToast("Không có trùng lịch. Có thể lưu phân công.", "success");
      } else {
        showToast(
          "Phát hiện vấn đề trùng lịch hoặc thiếu thời khóa biểu. Xem chi tiết ngay trên từng lớp.",
          "info",
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Lỗi kiểm tra trùng lặp",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!canSave) {
      showToast("Vui lòng kiểm tra trùng lặp trước khi lưu", "error");
      return;
    }

    if (!selectedAcademicYear || !selectedSemester || !selectedSubject) {
      showToast("Vui lòng chọn năm học, học kỳ và môn", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payloads: TeachingAssignmentUpsertPayload[] = [];

      allClasses.forEach((classItem) => {
        const key = classItem.code;
        const teacherCode = (assignments[key] ?? "").trim().toUpperCase();
        if (!teacherCode) {
          return;
        }

        payloads.push({
          classCode: classItem.code,
          subjectCode: selectedSubject,
          semesterCode: selectedSemester,
          academicYearCode: selectedAcademicYear,
          teacherCode,
          note: (notesByClass[classItem.code] ?? "").trim() || undefined,
        });
      });

      for (const payload of payloads) {
        const key = payload.classCode;
        const assignmentId = existingAssignmentIds[key];

        if (assignmentId) {
          await teachingApi.update(assignmentId, payload);
        } else {
          await teachingApi.create(payload);
        }
      }

      showToast("Phân công giáo viên thành công", "success");
      router.push(
        `/teaching-assignments?academicYear=${encodeURIComponent(selectedAcademicYear)}&semester=${encodeURIComponent(selectedSemester)}&subject=${encodeURIComponent(selectedSubject)}`,
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Lỗi lưu phân công",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {hoveredTeacher ? (
        <div
          className="pointer-events-none fixed z-[60] w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
          style={{ left: hoveredTeacher.x + 14, top: hoveredTeacher.y + 14 }}
        >
          <p className="text-xs font-semibold text-slate-900">
            {teacherNameByCode.get(hoveredTeacher.code) ?? hoveredTeacher.code}{" "}
            ({hoveredTeacher.code})
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-700">
            Tổng số tiết:{" "}
            {teacherInsights[hoveredTeacher.code]?.totalPeriods ?? 0}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-700">
            Các lớp đang dạy
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {teacherInsights[hoveredTeacher.code]?.classes.length
              ? teacherInsights[hoveredTeacher.code].classes.join(", ")
              : "Chưa có"}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-700">
            Lịch bị trùng
          </p>
          {teacherInsights[hoveredTeacher.code]?.conflicts.length ? (
            <div className="mt-1 space-y-1">
              {teacherInsights[hoveredTeacher.code].conflicts.map(
                (conflictText) => (
                  <p
                    key={`${hoveredTeacher.code}-${conflictText}`}
                    className="text-xs text-rose-700"
                  >
                    • {conflictText}
                  </p>
                ),
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-emerald-700">Không có trùng lịch</p>
          )}
        </div>
      ) : null}

      <PageIntro
        eyebrow="Teaching / Assign Teachers"
        title="Phân công giáo viên"
        description="Phân công giáo viên cho toàn bộ lớp theo môn đã chọn."
        actions={
          <>
            <Link
              href="/teaching-assignments"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>
          </>
        }
      />

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Năm học
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="">-- Chọn năm học --</option>
              {yearOptions.map((year) => (
                <option key={year.code} value={year.code}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Học kỳ
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              Môn (để phân công)
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="">-- Chọn môn --</option>
              {subjectOptions.map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Lọc lớp cần phân công
            </label>
            <input
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              placeholder="Ví dụ: 10A, 11A2..."
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">Tiến độ phân công</p>
            <p className="mt-1 text-slate-700">
              Đã gán: {assignmentProgress.assigned}/{assignmentProgress.total}
            </p>
            <p className="text-slate-700">
              Chưa gán: {assignmentProgress.unassigned}
            </p>
            <p className="text-slate-700">
              Hoàn thành: {assignmentProgress.completionRate}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isLiveChecking
                ? "Đang kiểm tra trùng lịch tự động..."
                : "Hệ thống tự động kiểm tra trùng lịch khi đổi giáo viên."}
            </p>
          </div>
        </div>

        {liveCheckError ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {liveCheckError}
          </div>
        ) : null}
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Danh sách lớp theo môn đã chọn ({classRows.length} lớp)
          </h3>
        </div>

        {classRows.length === 0 ? (
          <div className="px-6 py-4 text-sm text-slate-500">
            Không có lớp phù hợp bộ lọc hoặc chưa có thời khóa biểu cho môn đã
            chọn.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="w-44 border-b border-r border-slate-200 px-4 py-3 font-semibold">
                      Lớp
                    </th>
                    <th className="w-80 border-b border-r border-slate-200 px-4 py-3 font-semibold">
                      Giáo viên phụ trách
                    </th>
                    <th className="w-80 border-b border-r border-slate-200 px-4 py-3 font-semibold">
                      Lịch học
                    </th>
                    <th className="w-24 border-b border-r border-slate-200 px-4 py-3 font-semibold">
                      Số tiết
                    </th>
                    <th className="w-80 border-b border-r border-slate-200 px-4 py-3 font-semibold">
                      Trạng thái
                    </th>
                    <th className="w-80 border-b border-slate-200 px-4 py-3 font-semibold">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {classRows.map((row) => {
                    const selectedTeacherCode = assignments[row.code] ?? "";
                    const timetableSlots = (
                      subjectTimetableByClass[row.code] ?? []
                    )
                      .slice()
                      .sort(
                        (a, b) =>
                          a.dayOfWeek - b.dayOfWeek ||
                          a.periodStart - b.periodStart,
                      );
                    const issues = inlineIssuesByClass[row.code] ?? [];
                    const periodCount = classPeriodCountByCode[row.code] ?? 0;
                    const note = notesByClass[row.code] ?? "";
                    const teacherLabel =
                      teacherNameByCode.get(selectedTeacherCode) ??
                      selectedTeacherCode;

                    return (
                      <tr key={row.code} className="align-top">
                        <td className="border-b border-r border-slate-200 px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {row.code}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.name} · Khối {row.grade}
                          </p>
                        </td>
                        <td className="border-b border-r border-slate-200 px-4 py-3">
                          <select
                            value={selectedTeacherCode}
                            onChange={(e) =>
                              handleTeacherChange(row.code, e.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                          >
                            <option value="">-- Chọn giáo viên --</option>
                            {teacherOptions.map((teacher) => (
                              <option key={teacher.code} value={teacher.code}>
                                {teacher.name} ({teacher.code})
                              </option>
                            ))}
                          </select>

                          {selectedTeacherCode ? (
                            <div className="mt-2 inline-flex">
                              <span
                                className="cursor-default rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700"
                                onMouseEnter={(event) =>
                                  handleTeacherBadgeEnter(
                                    selectedTeacherCode,
                                    event.clientX,
                                    event.clientY,
                                  )
                                }
                                onMouseMove={(event) =>
                                  handleTeacherBadgeMove(
                                    selectedTeacherCode,
                                    event.clientX,
                                    event.clientY,
                                  )
                                }
                                onMouseLeave={handleTeacherBadgeLeave}
                              >
                                {teacherLabel} ({selectedTeacherCode})
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td className="border-b border-r border-slate-200 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {timetableSlots.length === 0 ? (
                              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                                Chưa có thời khóa biểu cho lớp này
                              </span>
                            ) : (
                              timetableSlots.map((slot, index) => (
                                <span
                                  key={`${row.code}-${slot.dayOfWeek}-${slot.periodStart}-${slot.periodEnd}-${index}`}
                                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                                >
                                  {DAYS_LABEL[slot.dayOfWeek] ??
                                    `Thứ ${slot.dayOfWeek}`}
                                  : Tiết {slot.periodStart}-{slot.periodEnd}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="border-b border-r border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          {periodCount}
                        </td>
                        <td className="border-b border-r border-slate-200 px-4 py-3">
                          {selectedTeacherCode ? (
                            issues.length > 0 ? (
                              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                {issues.map((message) => (
                                  <p key={`${row.code}-${message}`}>
                                    {message}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                                Không phát hiện trùng lịch cho lớp này.
                              </div>
                            )
                          ) : (
                            <p className="text-xs text-slate-500">
                              Chọn giáo viên để kiểm tra trùng lịch ngay.
                            </p>
                          )}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3">
                          <input
                            value={note}
                            onChange={(e) =>
                              handleNoteChange(row.code, e.target.value)
                            }
                            placeholder="Nhập ghi chú cho lớp này..."
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {classRows.map((row) => {
                const selectedTeacherCode = assignments[row.code] ?? "";
                const timetableSlots = (subjectTimetableByClass[row.code] ?? [])
                  .slice()
                  .sort(
                    (a, b) =>
                      a.dayOfWeek - b.dayOfWeek ||
                      a.periodStart - b.periodStart,
                  );
                const issues = inlineIssuesByClass[row.code] ?? [];
                const periodCount = classPeriodCountByCode[row.code] ?? 0;
                const note = notesByClass[row.code] ?? "";
                const teacherLabel =
                  teacherNameByCode.get(selectedTeacherCode) ??
                  selectedTeacherCode;

                return (
                  <div
                    key={`mobile-${row.code}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {row.code} · {row.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Khối {row.grade}
                    </p>

                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Giáo viên phụ trách
                      </label>
                      <select
                        value={selectedTeacherCode}
                        onChange={(e) =>
                          handleTeacherChange(row.code, e.target.value)
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      >
                        <option value="">-- Chọn giáo viên --</option>
                        {teacherOptions.map((teacher) => (
                          <option key={teacher.code} value={teacher.code}>
                            {teacher.name} ({teacher.code})
                          </option>
                        ))}
                      </select>

                      {selectedTeacherCode ? (
                        <div className="mt-2 inline-flex">
                          <span
                            className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700"
                            onMouseEnter={(event) =>
                              handleTeacherBadgeEnter(
                                selectedTeacherCode,
                                event.clientX,
                                event.clientY,
                              )
                            }
                            onMouseMove={(event) =>
                              handleTeacherBadgeMove(
                                selectedTeacherCode,
                                event.clientX,
                                event.clientY,
                              )
                            }
                            onMouseLeave={handleTeacherBadgeLeave}
                          >
                            {teacherLabel} ({selectedTeacherCode})
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {timetableSlots.length === 0 ? (
                        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                          Chưa có thời khóa biểu
                        </span>
                      ) : (
                        timetableSlots.map((slot, index) => (
                          <span
                            key={`mobile-slot-${row.code}-${slot.dayOfWeek}-${slot.periodStart}-${slot.periodEnd}-${index}`}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                          >
                            {DAYS_LABEL[slot.dayOfWeek] ??
                              `Thứ ${slot.dayOfWeek}`}
                            : Tiết {slot.periodStart}-{slot.periodEnd}
                          </span>
                        ))
                      )}
                    </div>

                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      Số tiết:{" "}
                      <span className="font-semibold text-slate-900">
                        {periodCount}
                      </span>
                    </div>

                    <div className="mt-3">
                      {selectedTeacherCode ? (
                        issues.length > 0 ? (
                          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {issues.map((message) => (
                              <p key={`mobile-${row.code}-${message}`}>
                                {message}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                            Không phát hiện trùng lịch cho lớp này.
                          </div>
                        )
                      ) : (
                        <p className="text-xs text-slate-500">
                          Chọn giáo viên để kiểm tra trùng lịch ngay.
                        </p>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Ghi chú
                      </label>
                      <input
                        value={note}
                        onChange={(e) =>
                          handleNoteChange(row.code, e.target.value)
                        }
                        placeholder="Nhập ghi chú cho lớp này..."
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Panel>

      <div className="flex justify-end gap-3">
        <Button
          tone="ghost"
          onClick={clearAllAssignments}
          disabled={isLoading || isSaving}
        >
          Đặt lại phân công
        </Button>
        <Button
          tone="secondary"
          onClick={checkDuplicate}
          disabled={isLoading || isSaving}
        >
          Kiểm tra lại
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving || !canSave}
        >
          {isSaving ? "Đang lưu..." : "Lưu phân công"}
        </Button>
      </div>

      {showIssueModal && hasAnyIssue ? (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,30rem)] rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">Tổng hợp vấn đề hiện tại</p>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setShowIssueModal(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-amber-300 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              X
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {missingTimetableClasses.length > 0 ? (
              <p>
                Chưa có thời khóa biểu cho: {missingTimetableClasses.join(", ")}
              </p>
            ) : null}
            {duplicateConflicts.length > 0 ? (
              <p>
                Phát hiện {duplicateConflicts.length} xung đột lịch dạy. Chi
                tiết đã hiển thị trực tiếp theo từng lớp.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
