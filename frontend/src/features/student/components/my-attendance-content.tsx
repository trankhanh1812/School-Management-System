"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { attendanceApi } from "@/features/attendance/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useToast } from "@/shared/components/toast-provider";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export function MyAttendanceContent() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<
    Array<{
      attendanceId: string;
      subjectName: string;
      className: string;
      sessionStartTime: string;
      status: string;
      method: string;
      capturedByName?: string;
    }>
  >([]);
  const [stats, setStats] = useState<{
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    presentRate: number;
  } | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1).toISOString();
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
    return { start, end };
  }, []);

  const loadAttendance = useCallback(
    async (notify = false) => {
      setLoading(true);
      try {
        const [historyResponse, statsResponse] = await Promise.all([
          attendanceApi.getMyAttendance(),
          attendanceApi.getMyStats(dateRange.start, dateRange.end),
        ]);

        setRecords(historyResponse.data ?? []);
        setStats(statsResponse.data ?? null);
        if (notify) {
          showToast("Đã tải dữ liệu điểm danh", "success");
        }
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu điểm danh",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [dateRange.start, dateRange.end, showToast],
  );

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const attendanceData = {
    totalDays: stats?.totalSessions ?? 0,
    presentDays: stats?.presentCount ?? 0,
    absentDays: stats?.absentCount ?? 0,
    lateArrivals: stats?.lateCount ?? 0,
    attendanceRate: Number(((stats?.presentRate ?? 0) * 100).toFixed(1)),
    recentRecords: records,
  };

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Điểm danh"
        title="Lịch sử điểm danh"
        description="Xem tình hình có mặt, vắng mặt và đến trễ của bạn trong năm học."
      />

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Dữ liệu điểm danh của bạn trong năm học được cập nhật tự động.
          </p>
          <Button
            onClick={() => void loadAttendance(true)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Đang tải..." : "Làm mới"}
          </Button>
        </div>
      </Panel>

      {/* Statistics */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-600">Tổng số ngày học</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {attendanceData.totalDays}
          </p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-green-600">Có mặt</p>
          <p className="mt-2 text-3xl font-bold text-green-900">
            {attendanceData.presentDays}
          </p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-red-600">Vắng mặt</p>
          <p className="mt-2 text-3xl font-bold text-red-900">
            {attendanceData.absentDays}
          </p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-yellow-600">Đến trễ</p>
          <p className="mt-2 text-3xl font-bold text-yellow-900">
            {attendanceData.lateArrivals}
          </p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-blue-600">Tỷ lệ</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">
            {attendanceData.attendanceRate}%
          </p>
        </Panel>
      </section>

      {/* Recent Records */}
      <Panel className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Lịch sử gần đây
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-900">
                  Ngày
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">
                  Môn học
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">
                  Trạng thái
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-semibold text-slate-900">
                  Phương thức
                </th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.recentRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-slate-500">
                    Chưa có dữ liệu điểm danh.
                  </td>
                </tr>
              ) : (
                attendanceData.recentRecords.map((record) => (
                  <tr
                    key={record.attendanceId}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                      {new Date(record.sessionStartTime).toLocaleString(
                        "vi-VN",
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {record.subjectName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-lg px-3 py-1 text-sm font-medium ${
                          record.status === "PRESENT"
                            ? "bg-green-100 text-green-900"
                            : record.status === "ABSENT"
                              ? "bg-red-100 text-red-900"
                              : "bg-yellow-100 text-yellow-900"
                        }`}
                      >
                        {record.status === "PRESENT"
                          ? "Có mặt"
                          : record.status === "ABSENT"
                            ? "Vắng"
                            : record.status === "LATE"
                              ? "Đến trễ"
                              : "Có phép"}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-slate-600">
                      {record.method}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Lưu ý:</p>
        <p className="mt-1">
          Nếu bạn có bất kỳ câu hỏi nào về điểm danh, vui lòng liên hệ giáo viên
          chủ nhiệm.
        </p>
      </div>
    </div>
  );
}
