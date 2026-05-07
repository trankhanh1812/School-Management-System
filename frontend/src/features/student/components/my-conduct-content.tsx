"use client";

import { useCallback, useEffect, useState } from "react";
import { conductApi, type ConductRecord } from "@/features/conduct/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

const CONDUCT_LEVEL_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  EXCELLENT: { label: "Tốt", className: "bg-green-100 text-green-900" },
  GOOD: { label: "Khá", className: "bg-blue-100 text-blue-900" },
  AVERAGE: { label: "Trung bình", className: "bg-yellow-100 text-yellow-900" },
  WEAK: { label: "Yếu", className: "bg-red-100 text-red-900" },
  // Vietnamese fallbacks
  Tốt: { label: "Tốt", className: "bg-green-100 text-green-900" },
  Khá: { label: "Khá", className: "bg-blue-100 text-blue-900" },
  "Trung bình": { label: "Trung bình", className: "bg-yellow-100 text-yellow-900" },
  Yếu: { label: "Yếu", className: "bg-red-100 text-red-900" },
};

function ConductBadge({ level }: { level?: string }) {
  const config = level ? (CONDUCT_LEVEL_CONFIG[level] ?? null) : null;
  if (!config) {
    return (
      <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
        {level ?? "Chưa đánh giá"}
      </span>
    );
  }
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export function MyConductContent() {
  const [records, setRecords] = useState<ConductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await conductApi.myConduct();
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu hạnh kiểm.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải hạnh kiểm...</div>;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Hạnh kiểm"
        title="Hạnh kiểm của tôi"
        description="Kết quả đánh giá hạnh kiểm theo từng học kỳ do giáo viên chủ nhiệm ghi nhận."
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && records.length === 0 && (
        <EmptyState
          title="Chưa có dữ liệu hạnh kiểm"
          description="Hạnh kiểm sẽ được cập nhật sau khi giáo viên chủ nhiệm đánh giá cuối học kỳ."
        />
      )}

      {records.length > 0 && (
        <div className="grid gap-4">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((record, idx) => (
              <Panel key={idx} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {record.semesterCode} · {record.academicYearCode}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{record.className}</p>
                  </div>
                  <ConductBadge level={record.conductLevel} />
                </div>
                {record.remarks && (
                  <p className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-3">
                    {record.remarks}
                  </p>
                )}
                {record.assessedByName && (
                  <p className="mt-2 text-xs text-slate-400">
                    Đánh giá bởi: {record.assessedByName}
                  </p>
                )}
              </Panel>
            ))}
          </div>

          {/* Detail table */}
          <Panel className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Học kỳ</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Năm học</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Lớp</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Hạnh kiểm</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Nhận xét</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">GVCN</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{record.semesterCode}</td>
                      <td className="px-4 py-3 text-slate-700">{record.academicYearCode}</td>
                      <td className="px-4 py-3 text-slate-700">{record.className}</td>
                      <td className="px-4 py-3">
                        <ConductBadge level={record.conductLevel} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        {record.remarks || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.assessedByName || <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Lưu ý:</p>
        <p className="mt-1">
          Hạnh kiểm được đánh giá cuối mỗi học kỳ bởi giáo viên chủ nhiệm. Nếu có thắc mắc,
          vui lòng liên hệ trực tiếp với giáo viên chủ nhiệm của lớp.
        </p>
      </div>
    </div>
  );
}
