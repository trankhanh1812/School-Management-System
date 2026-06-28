"use client";

import { useState, useMemo } from "react";
import { Panel } from "@/shared/ui/panel";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/components/toast-provider";
import {
  teachingApi,
  type TeachingScheduleDetail,
  type TeachingAssignmentUpsertPayload,
} from "@/features/teaching/api";
import { detectConflicts } from "@/features/teaching/utils/schedule-formatter";

type GradeLevel = "all" | "10" | "11" | "12";
type TimeShift = "morning" | "afternoon";

interface TeachingAdminGridProps {
  mode: "create" | "edit";
  assignmentId?: string;
  initialData?: {
    teacherCode: string;
    subjectCode: string;
    semesterCode: string;
    academicYearCode: string;
    scheduleData?: TeachingScheduleDetail[];
  };
  onSaveSuccess?: () => void;
}

const DEFAULT_CLASS_OPTIONS = {
  "10": ["10A1", "10A2", "10A3"],
  "11": ["11A1", "11A2", "11A3"],
  "12": ["12A1", "12A2"],
};

const DEFAULT_TEACHER_OPTIONS = [
  { code: "GV001", name: "Nguyễn Thu Hà" },
  { code: "GV002", name: "Trần Minh Khôi" },
  { code: "GV003", name: "Lê Hoàng Nam" },
];

const DEFAULT_SUBJECT_OPTIONS = [
  { code: "TOAN", name: "Toán" },
  { code: "VAN", name: "Văn" },
];

const DEFAULT_SEMESTER_OPTIONS = [
  { code: "HK1", name: "Học kỳ 1" },
  { code: "HK2", name: "Học kỳ 2" },
];

const DEFAULT_YEAR_OPTIONS = [
  { code: "2024-2025", name: "2024-2025" },
  { code: "2025-2026", name: "2025-2026" },
];

const DAYS_OF_WEEK = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
];

const PERIODS = [1, 2, 3, 4, 5];

export function TeachingAdminGrid({
  mode = "create",
  assignmentId,
  initialData,
  onSaveSuccess,
}: TeachingAdminGridProps) {
  const { showToast } = useToast();

  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialData?.subjectCode || "",
  );
  const [selectedSemester, setSelectedSemester] = useState<string>(
    initialData?.semesterCode || "",
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    initialData?.academicYearCode || "",
  );
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>("all");

  const [cellData, setCellData] = useState<Record<string, string>>(() => {
    if (!initialData?.scheduleData) return {};
    const data: Record<string, string> = {};
    initialData.scheduleData.forEach((s) => {
      const key = `${s.classCode}_${s.day}_${s.period}`;
      data[key] = initialData.teacherCode;
    });
    return data;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [shiftByGrade, setShiftByGrade] = useState<Record<string, TimeShift>>({
    "10": "morning",
    "11": "morning",
    "12": "morning",
  });

  const getClassesForDisplay = (): Record<string, string[]> => {
    if (selectedGrade === "all") {
      return {
        "10": DEFAULT_CLASS_OPTIONS["10"],
        "11": DEFAULT_CLASS_OPTIONS["11"],
        "12": DEFAULT_CLASS_OPTIONS["12"],
      };
    }
    return {
      [selectedGrade]:
        DEFAULT_CLASS_OPTIONS[
          selectedGrade as keyof typeof DEFAULT_CLASS_OPTIONS
        ],
    };
  };

  const handleCellChange = (
    classCode: string,
    day: number,
    period: number,
    teacherCode: string,
  ) => {
    const key = `${classCode}_${day}_${period}`;
    setCellData((prev) => ({
      ...prev,
      [key]: teacherCode || "",
    }));
  };

  // Detect conflicts for current teacher
  const scheduleList = useMemo(() => {
    const list: TeachingScheduleDetail[] = [];
    Object.entries(cellData).forEach(([key, teacherCode]) => {
      if (teacherCode) {
        const [classCode, day, period] = key.split("_");
        const grade = classCode.substring(0, 2); // "10A1" -> "10"
        const shift = shiftByGrade[grade] || "morning";
        list.push({
          day: parseInt(day),
          period: parseInt(period),
          shift,
          classCode,
        });
      }
    });
    return list;
  }, [cellData, shiftByGrade]);

  const conflicts = useMemo(() => {
    return detectConflicts(scheduleList, "");
  }, [scheduleList]);

  const isConflict = (
    classCode: string,
    day: number,
    period: number,
  ): boolean => {
    return conflicts.some(
      (c) => c.day === day && c.period === period && c.classCode === classCode,
    );
  };

  const handleSave = async () => {
    if (!selectedSubject || !selectedSemester || !selectedYear) {
      showToast("Vui lòng chọn đầy đủ: Môn, Học kỳ, Năm học", "error");
      return;
    }

    if (scheduleList.length === 0) {
      showToast("Vui lòng chọn ít nhất một thời gian dạy", "error");
      return;
    }

    try {
      setIsSaving(true);

      // For each unique class in schedule, create/update an assignment
      const classesByCode = new Map<string, TeachingScheduleDetail[]>();
      scheduleList.forEach((s) => {
        if (!classesByCode.has(s.classCode)) {
          classesByCode.set(s.classCode, []);
        }
        classesByCode.get(s.classCode)!.push(s);
      });

      for (const [classCode, schedule] of classesByCode) {
        const payload: TeachingAssignmentUpsertPayload = {
          teacherCode: initialData?.teacherCode || "GV001", // In create mode, this should come from selection
          classCode,
          subjectCode: selectedSubject,
          semesterCode: selectedSemester,
          academicYearCode: selectedYear,
          scheduleData: schedule,
        };

        if (mode === "create") {
          await teachingApi.create(payload);
        } else if (assignmentId) {
          await teachingApi.update(assignmentId, payload);
        }
      }

      showToast(
        `${mode === "create" ? "Tạo" : "Cập nhật"} phân công thành công`,
        "success",
      );
      onSaveSuccess?.();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : `Lỗi khi ${mode === "create" ? "tạo" : "cập nhật"} phân công`,
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderGrid = (gradeLevel: string, classes: string[]) => {
    const shift = shiftByGrade[gradeLevel] || "morning";

    return (
      <div key={gradeLevel} className="grid gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Khối {gradeLevel}
          </h3>
          <select
            value={shift}
            onChange={(e) =>
              setShiftByGrade((prev) => ({
                ...prev,
                [gradeLevel]: e.target.value as TimeShift,
              }))
            }
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="morning">Sáng</option>
            <option value="afternoon">Chiều</option>
          </select>
        </div>

        {/* Horizontal scroll table */}
        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-left sticky left-0 z-10">
                  Ngày / Tiết
                </th>
                {classes.map((classCode) => (
                  <th
                    key={classCode}
                    className="border border-slate-300 bg-slate-100 px-4 py-2 font-semibold text-center min-w-[140px]"
                  >
                    {classCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) =>
                PERIODS.map((period) => {
                  const isConflictRow = classes.some((c) =>
                    isConflict(c, day.value, period),
                  );

                  return (
                    <tr
                      key={`${day.value}_${period}`}
                      className={isConflictRow ? "bg-rose-50" : ""}
                    >
                      <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-medium sticky left-0 z-10 whitespace-nowrap">
                        {day.label} - Tiết {period}
                      </td>
                      {classes.map((classCode) => {
                        const cellKey = `${classCode}_${day.value}_${period}`;
                        const selectedTeacher = cellData[cellKey];
                        const hasConflict = isConflict(
                          classCode,
                          day.value,
                          period,
                        );
                        const bgColor = hasConflict
                          ? "bg-rose-100"
                          : selectedTeacher
                            ? "bg-sky-50"
                            : "bg-white";
                        const borderColor = hasConflict
                          ? "border-rose-300"
                          : "border-slate-300";

                        return (
                          <td
                            key={cellKey}
                            className={`border ${borderColor} ${bgColor} p-2 text-center min-w-[140px]`}
                          >
                            <select
                              value={selectedTeacher || ""}
                              onChange={(e) =>
                                handleCellChange(
                                  classCode,
                                  day.value,
                                  period,
                                  e.target.value,
                                )
                              }
                              className={`h-8 w-full rounded border px-2 text-xs font-medium ${
                                hasConflict
                                  ? "border-rose-400 bg-white text-rose-700"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <option value="">-- Chọn --</option>
                              {DEFAULT_TEACHER_OPTIONS.map((teacher) => (
                                <option key={teacher.code} value={teacher.code}>
                                  {teacher.name}
                                </option>
                              ))}
                            </select>
                            {selectedTeacher && (
                              <div
                                className={`mt-1 text-xs font-semibold ${hasConflict ? "text-rose-700" : "text-sky-700"}`}
                              >
                                {
                                  DEFAULT_TEACHER_OPTIONS.find(
                                    (t) => t.code === selectedTeacher,
                                  )?.name
                                }
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const classesForDisplay = getClassesForDisplay();

  return (
    <div className="grid gap-6">
      {/* Filters */}
      <Panel className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Bộ lọc</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Môn học
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">-- Chọn môn --</option>
              {DEFAULT_SUBJECT_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Học kỳ
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">-- Chọn học kỳ --</option>
              {DEFAULT_SEMESTER_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Năm học
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">-- Chọn năm --</option>
              {DEFAULT_YEAR_OPTIONS.map((y) => (
                <option key={y.code} value={y.code}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Khối
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>
        </div>

        {conflicts.length > 0 && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-700">
              ⚠ Phát hiện xung đột lịch dạy:
            </p>
            <div className="mt-2 text-xs text-rose-600">
              {conflicts.map((c, i) => (
                <div key={i}>
                  {DAYS_OF_WEEK.find((d) => d.value === c.day)?.label} - Tiết{" "}
                  {c.period}, Lớp {c.classCode}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* Grade cards */}
      {Object.entries(classesForDisplay).map(([gradeLevel, classes]) => (
        <Panel key={gradeLevel} className="p-6">
          {renderGrid(gradeLevel, classes)}
        </Panel>
      ))}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          className="h-11 px-5"
          tone="primary"
          onClick={handleSave}
          disabled={
            isSaving || !selectedSubject || !selectedSemester || !selectedYear
          }
        >
          {isSaving
            ? "Đang lưu..."
            : mode === "create"
              ? "Tạo phân công"
              : "Cập nhật phân công"}
        </Button>
      </div>
    </div>
  );
}
