"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { attendanceApi } from "@/features/attendance/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useToast } from "@/shared/components/toast-provider";
import { Button } from "@/shared/ui/button";
import { FormInput } from "@/shared/ui/form-field";
import { Panel } from "@/shared/ui/panel";

export function MyAttendanceContent() {
  const { session } = useAuthSession();
  const { showToast } = useToast();

  const [studentCode, setStudentCode] = useState(session?.user.email ?? "");
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

  async function loadAttendance() {
    if (!studentCode.trim()) {
      showToast("Vui lòng nhập mã học sinh", "error");
      return;
    }

    setLoading(true);
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        attendanceApi.getStudentAttendance(studentCode.trim()),
        attendanceApi.getStats(studentCode.trim(), dateRange.start, dateRange.end),
      ]);

      setRecords(historyResponse.data ?? []);
      setStats(statsResponse.data ?? null);
      showToast("Đã tải dữ liệu điểm danh", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể tải dữ liệu điểm danh", "error");
    } finally {
      setLoading(false);
    }
  }

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

      {/* QR scan shortcut */}
      <Link
        href="/my-attendance/qr-scan"
        className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white text-2xl">
          📷
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-900">Điểm danh bằng QR</p>
          <p className="text-sm text-blue-700">
            Dùng camera điện thoại quét mã QR giáo viên hiển thị — xem hướng dẫn chi tiết.
          </p>
        </div>
        <span className="text-blue-400">→</span>
      </Link>

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <FormInput
            label="Mã học sinh"
            hint="Nếu hệ thống chưa map tự động, nhập mã học sinh để tra cứu."
            value={studentCode}
            onChange={(event) => setStudentCode(event.target.value)}
            placeholder="VD: HS0001"
          />
          <div className="flex items-end">
            <Button onClick={() => void loadAttendance()} disabled={loading} className="w-full md:w-auto">
              {loading ? "Đang tải..." : "Xem dữ liệu điểm danh"}
            </Button>
          </div>
        </div>
      </Panel>

      {/* Statistics */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-600">Tổng số ngày học</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{attendanceData.totalDays}</p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-green-600">Có mặt</p>
          <p className="mt-2 text-3xl font-bold text-green-900">{attendanceData.presentDays}</p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-red-600">Vắng mặt</p>
          <p className="mt-2 text-3xl font-bold text-red-900">{attendanceData.absentDays}</p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-yellow-600">Đến trễ</p>
          <p className="mt-2 text-3xl font-bold text-yellow-900">{attendanceData.lateArrivals}</p>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <p className="text-sm font-medium text-blue-600">Tỷ lệ</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{attendanceData.attendanceRate}%</p>
        </Panel>
      </section>

      {/* Recent Records */}
      <Panel className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Lịch sử gần đây</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Ngày</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Môn học</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Trạng thái</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-semibold text-slate-900">Phương thức</th>
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
                <tr key={record.attendanceId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                    {new Date(record.sessionStartTime).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{record.subjectName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-lg px-2 py-1 text-xs font-medium ${
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
                  <td className="hidden sm:table-cell px-4 py-3 text-slate-600">{record.method}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Lưu ý:</p>
        <p className="mt-1">
          Nếu bạn có bất kỳ câu hỏi nào về điểm danh, vui lòng liên hệ giáo viên chủ nhiệm.
        </p>
      </div>
    </div>
  );
}
