"use client";

import { useEffect, useState } from "react";
import { studentApi } from "@/features/student/api";
import type { PromotionHistoryApiRecord } from "@/features/student/api";
import { formatDate } from "@/lib/utils/date";
import { Panel } from "@/shared/ui/panel";

type PromotionHistoryContentProps = {
  studentCode: string;
};

const resultColorMap: Record<string, string> = {
  PROMOTE: "bg-green-100 text-green-800",
  REPEAT: "bg-red-100 text-red-800",
  GRADUATING: "bg-blue-100 text-blue-800",
};

const resultLabelMap: Record<string, string> = {
  PROMOTE: "Lên lớp",
  REPEAT: "Ở lại",
  GRADUATING: "Tốt nghiệp",
};

export function PromotionHistoryContent({ studentCode }: PromotionHistoryContentProps) {
  const [data, setData] = useState<PromotionHistoryApiRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await studentApi.promotionHistory(studentCode);
        if (mounted) {
          setData(response.data ?? null);
        }
      } catch (loadError) {
        if (mounted) {
          setData(null);
          setError(loadError instanceof Error ? loadError.message : "Lỗi khi tải dữ liệu");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (studentCode) {
      void load();
    } else {
      setData(null);
      setIsLoading(false);
      setError(null);
    }

    return () => {
      mounted = false;
    };
  }, [studentCode]);

  if (isLoading) {
    return (
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử lên lớp</h3>
          </div>
          <div className="grid gap-3">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="p-5 sm:p-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử lên lớp</h3>
        <div className="mt-3 text-sm text-red-600">Lỗi khi tải dữ liệu: {error}</div>
      </Panel>
    );
  }

  const historyData = data ?? undefined;

  if (!historyData || historyData.records.length === 0) {
    return (
      <Panel className="p-5 sm:p-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử lên lớp</h3>
        <div className="mt-3 text-sm text-slate-500">Không có dữ liệu lịch sử lên lớp</div>
      </Panel>
    );
  }

  return (
    <Panel className="p-5 sm:p-6">
      <div className="grid gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử lên lớp</h3>
          <div className="mt-2 text-sm text-slate-500">
            {historyData.fullName} ({historyData.studentCode})
          </div>
        </div>
        <div className="space-y-4">
          {historyData.records.map((record, index) => (
            <div key={index} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:bg-slate-50">
              <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {record.fromClassName} ({record.fromAcademicYear})
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-medium text-sm">
                    {record.toClassName} ({record.toAcademicYear})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span>Ngày: {formatDate(record.promotedAt)}</span>
                  <span>•</span>
                  <span>Người phê duyệt: {record.promotedByName}</span>
                </div>
              </div>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    resultColorMap[record.promotionResult] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {resultLabelMap[record.promotionResult] || record.promotionResult}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
