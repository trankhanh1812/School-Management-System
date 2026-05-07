"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/features/dashboard/components/data-table";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useToast } from "@/shared/components/toast-provider";
import { Panel } from "@/shared/ui/panel";
import { formatSchedule } from "@/features/teaching/utils/schedule-formatter";
import type { TeachingScheduleDetail } from "@/features/teaching/api";
import { apiClient } from "@/lib/api/api-client";

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

interface AcademicYearOption {
  id: string;
  code: string;
  status?: string;
}

export function TeachingMyAssignmentsContent() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  
  const [records, setRecords] = useState<TeachingAssignmentRecord[]>([]);
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; code: string }>>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch academic years on mount
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await apiClient.get<{ data?: AcademicYearOption[]; message?: string; status?: number }>(
          "/academic-years",
          { authenticated: true }
        );

        const years = Array.isArray(response.data) ? response.data : [];
        setAcademicYears(years);
        
        // Auto-select first/current year
        if (years.length > 0) {
          setSelectedYearId(years[0].id);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
        showToast("Không thể tải danh sách năm học.", "error");
      }
    };

    fetchAcademicYears();
  }, [showToast]);

  // Fetch teaching assignments for selected year
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedYearId) return;

      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ academicYearId: selectedYearId });
        const response = await apiClient.get<ApiResponse>(`/teaching-assignments/me?${params.toString()}`, {
          authenticated: true,
        });

        const assignments = Array.isArray(response.data) ? response.data : [];
        setRecords(assignments);

        if (assignments.length === 0) {
          showToast("Không có phân công giảng dạy cho năm học này.", "info");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải dữ liệu";
        setError(message);
        showToast(message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedYearId, showToast]);

  // Calculate metrics
  const metrics = [
    {
      label: "Tổng phân công",
      value: String(records.length),
      trend: "Realtime",
      note: "Số bản ghi phân công hiện có",
    },
    {
      label: "Số môn dạy",
      value: String(new Set(records.map((r) => r.subjectCode)).size),
      trend: "Realtime",
      note: "Số môn theo năm học đã chọn",
    },
    {
      label: "Số lớp",
      value: String(new Set(records.map((r) => r.classCode)).size),
      trend: "Realtime",
      note: "Số lớp đang được phân công",
    },
    {
      label: "Học kỳ",
      value: String(new Set(records.map((r) => r.semesterCode)).size),
      trend: "Realtime",
      note: "Số học kỳ xuất hiện trong dữ liệu",
    },
  ];

  const columns = ["Môn học", "Lớp", "Lịch dạy", "Học kỳ"];

  const rows = records.map((item) => {
    const scheduleText = formatSchedule(item.scheduleData);

    return [
      `${item.subjectName} (${item.subjectCode})`,
      `${item.className} (${item.classCode})`,
      <div
        key={`schedule-${item.assignmentId}`}
        className="whitespace-pre-wrap text-xs text-slate-600"
      >
        {scheduleText}
      </div>,
      item.semesterCode,
    ];
  });

  return (
    <div className="grid gap-6">
      <PageIntro
        eyebrow="Teaching"
        title="Phân công giảng dạy của tôi"
        description="Danh sách các phân công thuộc tài khoản giáo viên hiện tại. Bạn có thể xem chi tiết từng phân công."
      />

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </Panel>
      )}

      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Năm học:
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Chọn năm học...</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.code}
              </option>
            ))}
          </select>
        </label>
      </div>

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
          Bạn chưa có phân công giảng dạy nào cho năm học này.
        </Panel>
      ) : (
        <DataTable
          title="Danh sách phân công của tôi"
          description="Giáo viên thường chỉ xem được danh sách phân công cá nhân theo năm học."
          columns={columns}
          rows={rows}
        />
      )}
    </div>
  );
}
