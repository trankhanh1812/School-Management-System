"use client";

import { useState } from "react";
import { Panel } from "@/shared/ui/panel";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/components/toast-provider";
import { teachingApi, type TeachingScheduleDetail, type TeachingAssignmentUpsertPayload } from "@/features/teaching/api";

type TimeShift = "morning" | "afternoon";

interface TeachingGridProps {
  assignmentId: string;
  teacherCode: string;
  teacherName: string;
  classCode: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  semesterCode: string;
  academicYearCode: string;
  scheduleData?: TeachingScheduleDetail[];
  onSaveSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
];

const PERIODS = [1, 2, 3, 4, 5];

export function TeachingAssignmentGrid({
  assignmentId,
  teacherCode,
  teacherName,
  classCode,
  className,
  subjectCode,
  subjectName,
  semesterCode,
  academicYearCode,
  scheduleData: initialScheduleData,
  onSaveSuccess,
}: TeachingGridProps) {
  const { showToast } = useToast();
  const [selectedShift, setSelectedShift] = useState<TimeShift>("morning");
  const [isSaving, setIsSaving] = useState(false);

  // Grid cell data: key = "classCode_dayOfWeek_period", value = teacherCode
  const [cellData, setCellData] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = {};
    if (initialScheduleData) {
      initialScheduleData.forEach((schedule) => {
        const key = `${schedule.classCode}_${schedule.day}_${schedule.period}`;
        data[key] = teacherCode || "";
      });
    }
    return data;
  });

  const getClassesForDisplay = (): Record<string, string[]> => {
    const gradeMatch = classCode.trim().toUpperCase().match(/^(10|11|12)/);
    const gradeLevel = gradeMatch?.[1] ?? "Khác";
    return { [gradeLevel]: [classCode] };
  };

  const handleCellChange = (targetClassCode: string, day: number, period: number, selected: boolean) => {
    const key = `${classCode}_${day}_${period}`;
    setCellData((prev) => ({
      ...prev,
      [key]: selected ? teacherCode : "",
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Transform cellData to schedule data format
      const scheduleList: TeachingScheduleDetail[] = [];
      Object.entries(cellData).forEach(([key, value]) => {
        if (value) {
          const [cellClassCode, day, period] = key.split("_");
          scheduleList.push({
            day: parseInt(day),
            period: parseInt(period),
            shift: selectedShift,
            classCode: cellClassCode,
          });
        }
      });

      const payload: TeachingAssignmentUpsertPayload = {
        teacherCode,
        classCode,
        subjectCode,
        semesterCode,
        academicYearCode,
        scheduleData: scheduleList,
      };

      const response = await teachingApi.update(assignmentId, payload);
      
      if (response.data) {
        showToast("Lưu phân công thành công", "success");
        onSaveSuccess?.();
      } else {
        showToast("Lưu phân công thất bại", "error");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Lỗi khi lưu phân công",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderGrid = (gradeLevel: string, classes: string[]) => {
    return (
      <div key={gradeLevel} className="grid gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Khối {gradeLevel}</h3>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Chọn ca:</label>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value as TimeShift)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="morning">Sáng</option>
            <option value="afternoon">Chiều</option>
          </select>
        </div>

        {/* Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left text-xs font-semibold">
                  Ngày / Tiết
                </th>
                {classes.map((classCode) => (
                  <th
                    key={classCode}
                    className="border border-slate-300 bg-slate-100 px-3 py-2 text-center text-xs font-semibold"
                  >
                    {classCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) =>
                PERIODS.map((period) => (
                  <tr key={`${day.value}_${period}`}>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium">
                      {day.label} - Tiết {period}
                    </td>
                    {classes.map((classCode) => {
                      const cellKey = `${classCode}_${day.value}_${period}`;
                      const assignedTeacher = cellData[cellKey];
                      const bgColor = assignedTeacher ? "bg-sky-50" : "bg-white";

                      return (
                        <td
                          key={cellKey}
                          className={`border border-slate-300 ${bgColor} p-2 text-center`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(assignedTeacher)}
                            onChange={(e) =>
                              handleCellChange(classCode, day.value, period, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          {assignedTeacher && (
                            <div className="mt-1 text-xs font-semibold text-sky-700">
                              {teacherName}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )),
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
      <Panel className="p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Giáo viên</label>
            <input
              type="text"
              value={teacherName}
              disabled
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lớp</label>
            <input
              type="text"
              value={className}
              disabled
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Môn</label>
            <input
              type="text"
              value={subjectName}
              disabled
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Học kỳ</label>
            <input
              type="text"
              value={semesterCode}
              disabled
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
            />
          </div>
        </div>
      </Panel>

      {/* Grids for each grade */}
      {Object.entries(classesForDisplay).map(([gradeLevel, classes]) => (
        <Panel key={gradeLevel} className="p-6">
          {renderGrid(gradeLevel, classes)}
        </Panel>
      ))}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          className="h-11 px-5" 
          tone="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Đang lưu..." : "Lưu phân công"}
        </Button>
        <Button className="h-11 px-5" tone="secondary">
          Hủy
        </Button>
      </div>
    </div>
  );
}
