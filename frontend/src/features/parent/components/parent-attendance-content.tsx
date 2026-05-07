"use client";

import { useCallback, useMemo, useState } from "react";
import { attendanceApi } from "@/features/attendance/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { useToast } from "@/shared/components/toast-provider";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import type { AttendanceRecord, AttendanceStats } from "@/features/attendance/types";

export function ParentAttendanceContent() {
  const { children, isLoading: profileLoading } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();
  const { showToast } = useToast();

  if (!selectedCode && children.length > 0 && children[0]) {
    setSelectedCode(children[0].studentCode);
  }

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const dateRange = useMemo(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), 0, 1).toISOString(),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
    };
  }, []);

  const loadAttendance = useCallback(async (code: string) => {
    if (!code) return;
    setLoading(true);
    try {
      const [histRes, statsRes] = await Promise.all([
        attendanceApi.getStudentAttendance(code),
        attendanceApi.getStats(code, dateRange.start, dateRange.end),
      ]);
      setRecords(histRes.data ?? []);
      setStats(statsRes.data ?? null);
      setLoaded(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể tải điểm danh", "error");
    } finally {
      setLoading(false);
    }
  }, [dateRange, showToast]);

  const handleChildSelect = (code: string) => {
    setSelectedCode(code);
    setLoaded(false);
    setRecords([]);
    setStats(null);
  };

  const attendanceRate = Number(((stats?.presentRate ?? 0) * 100).toFixed(1));

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Điểm danh"
        title="Điểm danh của con"
        description="Theo dõi tình hình có mặt, vắng mặt và đến trễ của con em trong năm học."
      />

      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn con</p>
        <ChildSelector children={children} selectedCode={selectedCode} onSelect={handleChildSelect} />
        {selectedCode && (
          <div className="mt-3">
            <Button onClick={() => void loadAttendance(selectedCode)} disabled={loading || profileLoading}>
              {loading ? "Đang tải..." : "Xem điểm danh"}
            </Button>
          </div>
        )}
      </Panel>

      {loaded && stats && (
        <section className="grid gap-3 sm:grid-cols-5">
          {[
            { label: "Tổng buổi học", value: stats.totalSessions, color: "text-slate-900" },
            { label: "Có mặt", value: stats.presentCount, color: "text-green-700" },
            { label: "Vắng mặt", value: stats.absentCount, color: "text-red-700" },
            { label: "Đến trễ", value: stats.lateCount, color: "text-yellow-700" },
            { label: "Tỷ lệ có mặt", value: `${attendanceRate}%`, color: "text-blue-700" },
          ].map((stat) => (
            <Panel key={stat.label} className="p-4 text-center">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Panel>
          ))}
        </section>
      )}

      {loaded && records.length > 0 && (
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Lịch sử điểm danh</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Ngày</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Môn học</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Phương thức</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.attendanceId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {new Date(r.sessionStartTime).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.subjectName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-xs font-medium ${
                        r.status === "PRESENT" ? "bg-green-100 text-green-800"
                        : r.status === "ABSENT" ? "bg-red-100 text-red-800"
                        : r.status === "LATE" ? "bg-yellow-100 text-yellow-800"
                        : "bg-slate-100 text-slate-700"
                      }`}>
                        {r.status === "PRESENT" ? "Có mặt"
                          : r.status === "ABSENT" ? "Vắng"
                          : r.status === "LATE" ? "Đến trễ"
                          : "Có phép"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {loaded && records.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Chưa có dữ liệu điểm danh cho học sinh này.
        </div>
      )}
    </div>
  );
}
