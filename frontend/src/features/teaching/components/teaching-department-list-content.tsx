"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { DataTable } from "@/features/dashboard/components/data-table";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useToast } from "@/shared/components/toast-provider";
import { Panel } from "@/shared/ui/panel";
import { formatSchedule } from "@/features/teaching/utils/schedule-formatter";
import { teachingApi, type TeachingScheduleDetail } from "@/features/teaching/api";

interface TeachingAssignmentRecord {
  assignmentId: string;
  teacherName: string;
  teacherCode: string;
  className: string;
  classCode: string;
  subjectName: string;
  subjectCode: string;
  semesterCode: string;
  academicYearCode: string;
  academicYearId: string;
  scheduleData?: TeachingScheduleDetail[];
}

interface ApiResponse {
  data: TeachingAssignmentRecord[];
  message: string;
  status: number;
}

export function TeachingDepartmentListContent() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  
  const [records, setRecords] = useState<TeachingAssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Department manager includes both head (1) and vice head (2)
  const isDepartmentManager =
    session?.user.role === "TEACHER" &&
    (session.user.departmentLevel === 1 || session.user.departmentLevel === 2);

  // Fetch department assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!session?.user.departmentCode) {
        setError("Không thể xác định phòng của bạn");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await teachingApi.listByDepartment(session.user.departmentCode);
        const rows = Array.isArray(response.data) ? response.data : [];

        setRecords(rows as TeachingAssignmentRecord[]);

        if (rows.length === 0) {
          showToast(
            "Không có phân công giảng dạy nào trong phòng của bạn.",
            "info"
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải dữ liệu";
        setError(message);
        showToast(message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (isDepartmentManager) {
      fetchAssignments();
    } else {
      setError("Bạn không có quyền truy cập trang này");
      setIsLoading(false);
    }
  }, [session, showToast, isDepartmentManager]);

  // Calculate metrics
  const metrics = [
    {
      label: "Tổng phân công",
      value: String(records.length),
      trend: "Realtime",
      note: "Tổng số bản ghi trong phòng",
    },
    {
      label: "Số giáo viên",
      value: String(new Set(records.map((r) => r.teacherCode)).size),
      trend: "Realtime",
      note: "Giáo viên có phân công trong phòng",
    },
    {
      label: "Số môn dạy",
      value: String(new Set(records.map((r) => r.subjectCode)).size),
      trend: "Realtime",
      note: "Môn học được phân công",
    },
    {
      label: "Số lớp",
      value: String(new Set(records.map((r) => r.classCode)).size),
      trend: "Realtime",
      note: "Lớp học có phân công",
    },
  ];

  const columns = [
    "Giáo viên",
    "Lớp",
    "Môn",
    "Lịch dạy",
    "Học kỳ",
    "Năm học",
    "Hành động",
  ];

  const rows = records.map((item) => {
    const scheduleText = formatSchedule(item.scheduleData);

    return [
      `${item.teacherName} (${item.teacherCode})`,
      `${item.className} (${item.classCode})`,
      `${item.subjectName} (${item.subjectCode})`,
      <div
        key={`schedule-${item.assignmentId}`}
        className="whitespace-pre-wrap text-xs text-slate-600"
      >
        {scheduleText}
      </div>,
      item.semesterCode,
      item.academicYearCode,
      <div key={`action-${item.assignmentId}`} className="flex gap-1">
        <Link
          href={`/teaching-assignments/${item.assignmentId}`}
          className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
        >
          Chi tiết
        </Link>
      </div>,
    ];
  });

  if (!isDepartmentManager) {
    return (
      <div className="grid gap-4">
        <PageIntro
          eyebrow="Teaching"
          title="Phân công giảng dạy - Phòng hiệu trưởng"
          description="Chỉ trưởng/phó bộ môn mới có thể truy cập trang này."
        />

        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageIntro
        eyebrow="Teaching"
        title="Phân công giảng dạy - Phòng"
        description={`Danh sách phân công của các giáo viên trong phòng ${session?.user.departmentCode}. Bạn có thể xem chi tiết từng phân công.`}
      />

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </Panel>
      )}

      {/* Metrics */}
      <section className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {/* Data Table */}
      {isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">
          Đang tải phân công giảng dạy...
        </Panel>
      ) : records.length === 0 ? (
        <Panel className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Không có phân công giảng dạy nào trong phòng của bạn.
        </Panel>
      ) : (
        <DataTable
          title="Phân công theo phòng"
          description="Danh sách phân công của giáo viên thuộc phòng hiện tại."
          columns={columns}
          rows={rows}
        />
      )}
    </div>
  );
}
