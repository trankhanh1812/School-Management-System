"use client";

import { useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useChildExams, useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: "Nháp",       cls: "bg-slate-100 text-slate-600" },
  SUBMITTED: { label: "Chờ duyệt",  cls: "bg-yellow-100 text-yellow-800" },
  APPROVED:  { label: "Đã duyệt",   cls: "bg-blue-100 text-blue-800" },
  PUBLISHED: { label: "Đã công bố", cls: "bg-green-100 text-green-800" },
  LOCKED:    { label: "Đã khóa",    cls: "bg-slate-200 text-slate-700" },
};

function formatDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return d; }
}

function daysUntil(d: string) {
  try {
    const exam = new Date(d); exam.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.ceil((exam.getTime() - today.getTime()) / 86400000);
  } catch { return null; }
}

type SemesterCode = "HK1" | "HK2";

export function ParentExamsContent() {
  const { children, isLoading: profileLoading } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();
  const [semesterCode, setSemesterCode] = useState<SemesterCode>("HK1");
  const [showPast, setShowPast] = useState(false);

  if (!selectedCode && children.length > 0 && children[0]) {
    setSelectedCode(children[0].studentCode);
  }

  const { exams, isLoading, error } = useChildExams(selectedCode, semesterCode);

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = exams.filter((e) => { const d = new Date(e.examDate); d.setHours(0,0,0,0); return d >= today; })
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  const past = exams.filter((e) => { const d = new Date(e.examDate); d.setHours(0,0,0,0); return d < today; })
    .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Lịch thi"
        title="Lịch thi của con"
        description="Danh sách các bài thi theo lớp và môn học trong học kỳ hiện tại."
      />

      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn con</p>
        <ChildSelector children={children} selectedCode={selectedCode} onSelect={setSelectedCode} />
      </Panel>

      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="parent-exam-semester" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Học kỳ</label>
            <select id="parent-exam-semester" value={semesterCode} onChange={(e) => setSemesterCode(e.target.value as SemesterCode)} className="mt-1 h-9 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 mt-4">
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Hiển thị bài thi đã qua
          </label>
        </div>
      </Panel>

      {(isLoading || profileLoading) && <div className="text-sm text-slate-500">Đang tải lịch thi...</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3">
        <h3 className="text-base font-semibold text-slate-900">Sắp tới ({upcoming.length})</h3>
        {upcoming.length === 0 && !isLoading ? (
          <EmptyState title="Không có bài thi sắp tới" description="Không có lịch thi nào trong học kỳ đã chọn." />
        ) : (
          upcoming.map((exam) => {
            const days = daysUntil(exam.examDate);
            const isToday = days === 0;
            const isSoon = days !== null && days > 0 && days <= 7;
            const cfg = STATUS_CONFIG[exam.status] ?? { label: exam.status, cls: "bg-slate-100 text-slate-600" };
            return (
              <Panel key={exam.examId} className={`p-4 ${isToday ? "border-orange-300 bg-orange-50" : isSoon ? "border-yellow-200 bg-yellow-50" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{exam.title}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                      {isToday && <span className="inline-block rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">Hôm nay</span>}
                      {isSoon && !isToday && <span className="inline-block rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">{days} ngày nữa</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{exam.subjectName} · {exam.examTypeLabel ?? exam.examType}{exam.weight ? ` · Hệ số ${exam.weight}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatDate(exam.examDate)}</p>
                    <p className="text-xs text-slate-500">{exam.semesterCode} · {exam.academicYearCode}</p>
                  </div>
                </div>
              </Panel>
            );
          })
        )}
      </div>

      {showPast && (
        <div className="grid gap-3">
          <h3 className="text-base font-semibold text-slate-900">Đã qua ({past.length})</h3>
          {past.length === 0 ? <p className="text-sm text-slate-500">Không có bài thi nào đã qua.</p> : (
            <Panel className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Bài thi</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Môn học</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Ngày thi</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {past.map((exam) => {
                    const cfg = STATUS_CONFIG[exam.status] ?? { label: exam.status, cls: "bg-slate-100 text-slate-600" };
                    return (
                      <tr key={exam.examId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{exam.title}</td>
                        <td className="px-4 py-3 text-slate-600">{exam.subjectName}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatDate(exam.examDate)}</td>
                        <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
