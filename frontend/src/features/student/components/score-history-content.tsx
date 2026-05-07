"use client";

import { useEffect, useState } from "react";
import { studentApi, type ScoreHistoryApiRecord } from "@/features/student/api";
import { formatDate } from "@/lib/utils/date";
import { Panel } from "@/shared/ui/panel";

interface ScoreHistoryContentProps {
  studentCode: string;
}

export function ScoreHistoryContent({ studentCode }: ScoreHistoryContentProps) {
  const [response, setResponse] = useState<ScoreHistoryApiRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await studentApi.scoreHistory(studentCode);
        if (mounted) {
          setResponse(result.data ?? null);
        }
      } catch (loadError) {
        if (mounted) {
          setResponse(null);
          setError(loadError instanceof Error ? loadError : new Error("Lỗi tải dữ liệu"));
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
      setResponse(null);
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
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử thay đổi điểm</h3>
        <div className="mt-4 grid gap-3">
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="p-5 sm:p-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử thay đổi điểm</h3>
        <p className="mt-3 text-sm text-red-600">Lỗi tải dữ liệu: {error.message}</p>
      </Panel>
    );
  }

  const scoreHistory = response;

  if (!scoreHistory || scoreHistory.records.length === 0) {
    return (
      <Panel className="p-5 sm:p-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử thay đổi điểm</h3>
        <p className="mt-3 text-sm text-slate-500">Không có lịch sử thay đổi điểm</p>
      </Panel>
    );
  }

  return (
    <Panel className="p-5 sm:p-6">
      <div className="grid gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Lịch sử thay đổi điểm</h3>
        </div>
        <div className="space-y-4">
          {scoreHistory.records.map((record, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:bg-slate-50">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{record.examTitle}</p>
                  <p className="text-xs text-slate-600">{record.subjectName}</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {record.examType}
                </span>
              </div>

              <div className="mb-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">
                    {record.oldValue !== null ? Number(record.oldValue).toFixed(2) : "N/A"}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-medium text-sm text-emerald-600">
                    {record.newValue !== null ? Number(record.newValue).toFixed(2) : "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span>{record.changedByName}</span>
                <span>{formatDate(record.changedAt)}</span>
              </div>

              {record.changeReason && record.changeReason !== "No reason provided" && (
                <p className="mt-2 text-xs italic text-slate-600">Lý do: {record.changeReason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
