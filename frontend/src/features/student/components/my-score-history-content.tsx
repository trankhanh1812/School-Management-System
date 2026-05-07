"use client";

import { useCallback, useEffect, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { studentApi, type ScoreHistoryRecord } from "@/features/student/api";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

function examTypeLabel(examType: string) {
  const map: Record<string, string> = {
    ORAL: "Miệng",
    QUIZ_15: "15 phút",
    ONE_PERIOD: "1 tiết",
    MIDTERM: "Giữa kỳ",
    FINAL: "Cuối kỳ",
    SURVEY: "Khảo sát",
  };
  return map[examType] ?? examType;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MyScoreHistoryContent() {
  const [records, setRecords] = useState<ScoreHistoryRecord[]>([]);
  const [studentCode, setStudentCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // First get own profile to get studentCode
      const profileRes = await studentApi.myProfile();
      const code = profileRes.data?.studentCode ?? "";
      setStudentCode(code);
      if (!code) {
        setError("Không tìm thấy mã học sinh.");
        return;
      }
      const res = await studentApi.scoreHistory(code);
      setRecords(res.data?.records ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lịch sử điểm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải lịch sử điểm...</div>;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Điểm số"
        title="Lịch sử thay đổi điểm"
        description="Ghi nhận các lần điểm số của bạn được chỉnh sửa, kèm lý do và người thực hiện."
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && records.length === 0 && (
        <EmptyState
          title="Không có lịch sử thay đổi"
          description="Điểm số của bạn chưa có lần chỉnh sửa nào được ghi nhận."
        />
      )}

      {records.length > 0 && (
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Môn học</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Bài thi</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Loại</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Điểm cũ</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Điểm mới</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Lý do</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Người sửa</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => {
                  const oldVal = record.oldValue;
                  const newVal = record.newValue;
                  const increased = newVal !== null && oldVal !== null && newVal > oldVal;
                  const decreased = newVal !== null && oldVal !== null && newVal < oldVal;

                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{record.subjectName}</td>
                      <td className="px-4 py-3 text-slate-700">{record.examTitle}</td>
                      <td className="px-4 py-3 text-slate-600">{examTypeLabel(record.examType)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {oldVal !== null ? oldVal.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block rounded-lg px-2 py-0.5 font-semibold ${
                            increased
                              ? "bg-green-100 text-green-900"
                              : decreased
                                ? "bg-red-100 text-red-900"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {newVal !== null ? newVal.toFixed(1) : "—"}
                          {increased && " ↑"}
                          {decreased && " ↓"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.changeReason || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{record.changedByName}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(record.changedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <p className="text-xs text-slate-500">
        Lịch sử này chỉ hiển thị các lần điểm được chỉnh sửa sau khi đã công bố. Nếu có thắc
        mắc, vui lòng liên hệ giáo viên bộ môn.
      </p>
    </div>
  );
}
