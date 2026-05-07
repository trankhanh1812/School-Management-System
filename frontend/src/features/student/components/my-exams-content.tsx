"use client";

import { useCallback, useEffect, useState } from "react";
import { examApi, type ExamRecord } from "@/features/exam/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

const EXAM_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Nháp", className: "bg-slate-100 text-slate-600" },
  SUBMITTED: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Đã duyệt", className: "bg-blue-100 text-blue-800" },
  PUBLISHED: { label: "Đã công bố", className: "bg-green-100 text-green-800" },
  LOCKED: { label: "Đã khóa", className: "bg-slate-200 text-slate-700" },
};

function ExamStatusBadge({ status }: { status: string }) {
  const config = EXAM_STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  try {
    const examDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

type SemesterCode = "HK1" | "HK2";

export function MyExamsContent() {
  const [allExams, setAllExams] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [semesterCode, setSemesterCode] = useState<SemesterCode>("HK1");
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await examApi.myExams({ semesterCode });
      setAllExams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lịch thi.");
    } finally {
      setIsLoading(false);
    }
  }, [semesterCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingExams = allExams
    .filter((e) => {
      if (!e.examDate) return false;
      const d = new Date(e.examDate);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    })
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  const pastExams = allExams
    .filter((e) => {
      if (!e.examDate) return false;
      const d = new Date(e.examDate);
      d.setHours(0, 0, 0, 0);
      return d < today;
    })
    .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải lịch thi...</div>;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Lịch thi"
        title="Lịch thi của tôi"
        description="Danh sách các bài thi theo lớp và môn học trong học kỳ hiện tại."
      />

      {/* Filters */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid gap-1">
            <label htmlFor="exam-semester" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Học kỳ
            </label>
            <select
              id="exam-semester"
              value={semesterCode}
              onChange={(e) => setSemesterCode(e.target.value as SemesterCode)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              id="show-past"
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="show-past" className="text-sm text-slate-600">
              Hiển thị bài thi đã qua
            </label>
          </div>
        </div>
      </Panel>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Upcoming exams */}
      <div className="grid gap-3">
        <h3 className="text-base font-semibold text-slate-900">
          Sắp tới ({upcomingExams.length})
        </h3>

        {upcomingExams.length === 0 ? (
          <EmptyState
            title="Không có bài thi sắp tới"
            description="Không có lịch thi nào trong học kỳ đã chọn."
          />
        ) : (
          <div className="grid gap-3">
            {upcomingExams.map((exam) => {
              const days = daysUntil(exam.examDate);
              const isToday = days === 0;
              const isSoon = days !== null && days <= 7 && days > 0;

              return (
                <Panel
                  key={exam.examId}
                  className={`p-4 ${isToday ? "border-orange-300 bg-orange-50" : isSoon ? "border-yellow-200 bg-yellow-50" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{exam.title}</p>
                        <ExamStatusBadge status={exam.status} />
                        {isToday && (
                          <span className="inline-block rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                            Hôm nay
                          </span>
                        )}
                        {isSoon && !isToday && (
                          <span className="inline-block rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
                            {days} ngày nữa
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {exam.subjectName} · {exam.examTypeLabel ?? exam.examType}
                        {exam.weight ? ` · Hệ số ${exam.weight}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{formatDate(exam.examDate)}</p>
                      <p className="text-xs text-slate-500">{exam.semesterCode} · {exam.academicYearCode}</p>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>

      {/* Past exams */}
      {showPast && (
        <div className="grid gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            Đã qua ({pastExams.length})
          </h3>
          {pastExams.length === 0 ? (
            <p className="text-sm text-slate-500">Không có bài thi nào đã qua.</p>
          ) : (
            <Panel className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Bài thi</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Môn học</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Loại</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Ngày thi</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {pastExams.map((exam) => (
                    <tr key={exam.examId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{exam.title}</td>
                      <td className="px-4 py-3 text-slate-600">{exam.subjectName}</td>
                      <td className="px-4 py-3 text-slate-600">{exam.examTypeLabel ?? exam.examType}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatDate(exam.examDate)}</td>
                      <td className="px-4 py-3">
                        <ExamStatusBadge status={exam.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Lưu ý:</p>
        <p className="mt-1">
          Lịch thi có thể thay đổi. Theo dõi thông báo từ nhà trường để cập nhật kịp thời.
        </p>
      </div>
    </div>
  );
}
