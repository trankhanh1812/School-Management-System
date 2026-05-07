"use client";

import { useEffect, useMemo, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { studentApi } from "@/features/student/api";
import { teachingApi, type TimetableEntryPayload } from "@/features/teaching/api";
import { Panel } from "@/shared/ui/panel";

type SemesterCode = "HK1" | "HK2";

const DAYS = [
  { label: "Thứ Hai", value: 1 }, { label: "Thứ Ba", value: 2 },
  { label: "Thứ Tư", value: 3 },  { label: "Thứ Năm", value: 4 },
  { label: "Thứ Sáu", value: 5 }, { label: "Thứ Bảy", value: 6 },
];

const PERIOD_TIME: Record<number, string> = {
  1: "07:00 - 07:45", 2: "07:50 - 08:35", 3: "08:45 - 09:30",
  4: "09:35 - 10:20", 5: "10:25 - 11:10", 6: "13:00 - 13:45",
  7: "13:50 - 14:35", 8: "14:45 - 15:30", 9: "15:35 - 16:20",
  10: "16:25 - 17:10",
};

function normalizeClassCode(raw?: string) {
  if (!raw) return "";
  const m = raw.trim().toUpperCase().match(/(10|11|12)[A-Z][0-9]+/);
  return m ? m[0] : raw.trim().toUpperCase();
}

function toTimeLabel(s: number, e: number) {
  const st = PERIOD_TIME[s] ?? `Tiết ${s}`;
  const et = PERIOD_TIME[e] ?? `Tiết ${e}`;
  return s === e ? st : `${st} – ${et}`;
}

export function ParentScheduleContent() {
  const { children, isLoading: profileLoading } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();
  const [semesterCode, setSemesterCode] = useState<SemesterCode>("HK1");
  const [entries, setEntries] = useState<TimetableEntryPayload[]>([]);
  const [classCode, setClassCode] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!selectedCode && children.length > 0 && children[0]) {
    setSelectedCode(children[0].studentCode);
  }

  useEffect(() => {
    if (!selectedCode) return;
    let mounted = true;
    setIsLoading(true);
    setError("");

    const load = async () => {
      try {
        // Use child profile via studentApi.detail (accessible to parent via backend RBAC)
        const profileRes = await studentApi.detail(selectedCode);
        const profile = profileRes.data;
        const cc = normalizeClassCode(profile?.className);
        const yr = profile?.academicYear?.trim() ?? "";

        if (!cc || !yr) {
          if (mounted) { setError("Chưa xác định được lớp hoặc năm học của học sinh."); setIsLoading(false); }
          return;
        }

        const timetableRes = await teachingApi.getTimetableGrid(semesterCode, yr);
        const all = Array.isArray(timetableRes.data) ? timetableRes.data : [];

        if (mounted) {
          setClassCode(cc);
          setAcademicYear(yr);
          setEntries(all.filter((e) => normalizeClassCode(e.classCode) === cc));
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Không thể tải thời khóa biểu.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => { mounted = false; };
  }, [selectedCode, semesterCode]);

  const groupedByDay = useMemo(() =>
    DAYS.map((day) => ({
      day: day.label,
      lessons: entries
        .filter((e) => Number(e.dayOfWeek) === day.value)
        .sort((a, b) => Number(a.periodStart) - Number(b.periodStart))
        .map((e) => ({
          time: toTimeLabel(Number(e.periodStart), Number(e.periodEnd)),
          subject: e.subjectCode,
          periodStart: Number(e.periodStart),
        })),
    })).filter((d) => d.lessons.length > 0),
  [entries]);

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Thời khóa biểu"
        title="Lịch học của con"
        description="Thời khóa biểu theo lớp của con em trong học kỳ đã chọn."
      />

      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn con</p>
        <ChildSelector children={children} selectedCode={selectedCode} onSelect={(c) => { setSelectedCode(c); setEntries([]); }} />
      </Panel>

      <Panel className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lớp</p><p className="mt-1 text-sm font-semibold text-slate-900">{classCode || "—"}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Năm học</p><p className="mt-1 text-sm font-semibold text-slate-900">{academicYear || "—"}</p></div>
          <div>
            <label htmlFor="parent-schedule-semester" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Học kỳ</label>
            <select id="parent-schedule-semester" value={semesterCode} onChange={(e) => setSemesterCode(e.target.value as SemesterCode)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm">
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>
        </div>
      </Panel>

      {(isLoading || profileLoading) && <Panel className="p-4 text-sm text-slate-500">Đang tải thời khóa biểu...</Panel>}
      {error && <Panel className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</Panel>}
      {!isLoading && !error && groupedByDay.length === 0 && selectedCode && (
        <Panel className="p-4 text-sm text-slate-500">Chưa có dữ liệu thời khóa biểu cho học kỳ đã chọn.</Panel>
      )}

      {groupedByDay.map((d) => (
        <div key={d.day} className="grid gap-3">
          <h3 className="text-base font-semibold text-slate-900">{d.day}</h3>
          <Panel className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Giờ học</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Môn học</th>
                </tr>
              </thead>
              <tbody>
                {d.lessons.map((l) => (
                  <tr key={`${d.day}-${l.periodStart}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{l.time}</td>
                    <td className="px-4 py-3 text-slate-700">{l.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      ))}
    </div>
  );
}
