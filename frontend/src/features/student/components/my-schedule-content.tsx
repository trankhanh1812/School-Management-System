"use client";

import { useEffect, useMemo, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { studentApi } from "@/features/student/api";
import {
  teachingApi,
  type TimetableEntryPayload,
} from "@/features/teaching/api";
import { Panel } from "@/shared/ui/panel";

type SemesterCode = "HK1" | "HK2";

const DAYS: Array<{ label: string; value: number }> = [
  { label: "Thứ Hai", value: 1 },
  { label: "Thứ Ba", value: 2 },
  { label: "Thứ Tư", value: 3 },
  { label: "Thứ Năm", value: 4 },
  { label: "Thứ Sáu", value: 5 },
  { label: "Thứ Bảy", value: 6 },
];

const PERIOD_TIME: Record<number, string> = {
  1: "07:00 - 07:45",
  2: "07:50 - 08:35",
  3: "08:45 - 09:30",
  4: "09:35 - 10:20",
  5: "10:25 - 11:10",
  6: "13:00 - 13:45",
  7: "13:50 - 14:35",
  8: "14:45 - 15:30",
  9: "15:35 - 16:20",
  10: "16:25 - 17:10",
};

function normalizeClassCode(rawValue?: string): string {
  if (!rawValue) {
    return "";
  }

  const normalized = rawValue.trim().toUpperCase();
  const codeMatch = normalized.match(/(10|11|12)[A-Z][0-9]+/);
  if (codeMatch) {
    return codeMatch[0];
  }
  return normalized;
}

function toTimeLabel(periodStart: number, periodEnd: number): string {
  const startText = PERIOD_TIME[periodStart] ?? `Tiết ${periodStart}`;
  const endText = PERIOD_TIME[periodEnd] ?? `Tiết ${periodEnd}`;

  if (periodStart === periodEnd) {
    return startText;
  }

  return `${startText} - ${endText}`;
}

export function MyScheduleContent() {
  const [academicYearCode, setAcademicYearCode] = useState("");
  const [semesterCode, setSemesterCode] = useState<SemesterCode>("HK1");
  const [studentClassCode, setStudentClassCode] = useState("");
  const [studentClassName, setStudentClassName] = useState("");
  const [entries, setEntries] = useState<TimetableEntryPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const profileResponse = await studentApi.myProfile();
        const profile = profileResponse.data;
        const className = profile?.className?.trim() ?? "";
        const classCode = normalizeClassCode(className);
        const yearCode = profile?.academicYear?.trim() ?? "";

        // Backend suy ra lớp/năm học của học sinh từ JWT và chỉ trả TKB của lớp đó.
        const timetableResponse =
          await teachingApi.getMyTimetableGrid(semesterCode);
        const allEntries = Array.isArray(timetableResponse.data)
          ? timetableResponse.data
          : [];

        if (!mounted) {
          return;
        }

        setStudentClassCode(classCode);
        setStudentClassName(className || classCode);
        setAcademicYearCode(yearCode);
        setEntries(allEntries);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setEntries([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải thời khóa biểu từ hệ thống.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [semesterCode]);

  const groupedByDay = useMemo(() => {
    return DAYS.map((day) => {
      const lessons = entries
        .filter((item) => Number(item.dayOfWeek) === day.value)
        .sort(
          (left, right) => Number(left.periodStart) - Number(right.periodStart),
        )
        .map((item) => ({
          time: toTimeLabel(Number(item.periodStart), Number(item.periodEnd)),
          subject: item.subjectCode,
          room: "--",
          teacher: "--",
          periodStart: Number(item.periodStart),
        }));

      return {
        day: day.label,
        lessons,
      };
    }).filter((item) => item.lessons.length > 0);
  }, [entries]);

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Thời khóa biểu"
        title="Lịch học của tôi"
        description="Hiển thị theo lớp hiện tại của học sinh từ dữ liệu thời khóa biểu hệ thống."
      />

      <Panel className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Lớp
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {studentClassName || studentClassCode || "--"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Năm học
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {academicYearCode || "--"}
            </p>
          </div>
          <div className="grid gap-1">
            <label
              htmlFor="my-schedule-semester"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Học kỳ
            </label>
            <select
              id="my-schedule-semester"
              value={semesterCode}
              onChange={(event) =>
                setSemesterCode(event.target.value as SemesterCode)
              }
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>
        </div>
      </Panel>

      {error ? (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </Panel>
      ) : null}

      {isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">
          Đang tải thời khóa biểu...
        </Panel>
      ) : null}

      {!isLoading && !error && groupedByDay.length === 0 ? (
        <Panel className="p-4 text-sm text-slate-500">
          Chưa có dữ liệu thời khóa biểu cho lớp hiện tại trong học kỳ đã chọn.
        </Panel>
      ) : null}

      {groupedByDay.map((daySchedule) => (
        <div key={daySchedule.day} className="grid gap-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {daySchedule.day}
          </h3>
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Giờ học
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Môn học
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Phòng
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Giáo viên
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daySchedule.lessons.map((lesson) => (
                    <tr
                      key={`${daySchedule.day}-${lesson.periodStart}-${lesson.subject}`}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {lesson.time}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {lesson.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900">
                          {lesson.room}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {lesson.teacher}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ))}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-medium">Hướng dẫn:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Thời khóa biểu có thể thay đổi trong quá trình năm học.</li>
          <li>Theo dõi thông báo từ nhà trường để cập nhật thay đổi.</li>
          <li>
            Dữ liệu hiện lấy theo tiết học và môn học từ bảng thời khóa biểu
            chính thức.
          </li>
        </ul>
      </div>
    </div>
  );
}
