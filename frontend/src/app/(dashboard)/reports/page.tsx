"use client";

import { useEffect } from "react";
import { DataTable } from "@/features/dashboard/components/data-table";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { DonutChart } from "@/features/report/components/donut-chart";
import { LineChart } from "@/features/report/components/line-chart";
import { StatBarList } from "@/features/report/components/stat-bar-list";
import { useEducationAnalytics } from "@/features/report/hooks";
import { useAuthSession } from "@/hooks";
import { Button, ButtonLink } from "@/shared/ui/button";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { Panel } from "@/shared/ui/panel";
import { env } from "@/lib/env";
import { getStoredTokens } from "@/lib/auth/token-storage";

function MetricSkeleton() {
  return (
    <Panel className="h-[152px] animate-pulse bg-slate-100/80">
      <div />
    </Panel>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Panel className="p-5">
      <div className="mb-4 h-5 w-40 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </Panel>
  );
}

export default function ReportsPage() {
  const { session } = useAuthSession();
  const isAdmin = session?.user.role === "ADMIN";
  const {
    snapshot,
    isLoading,
    isRefreshing,
    hasLoaded,
    error,
    refresh,
    triggerLoad,
  } = useEducationAnalytics();

  // Auto-trigger load when the page mounts (deferred — not blocking render)
  useEffect(() => {
    triggerLoad();
  }, [triggerLoad]);

  async function downloadReport(type: "students" | "teaching-assignments") {
    const tokens = getStoredTokens();
    const url = `${env.apiBaseUrl}/reports/export/${type}`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: tokens?.accessToken
            ? `Bearer ${tokens.accessToken}`
            : "",
        },
      });
      if (!res.ok) throw new Error("Không thể tải báo cáo");
      const blob = await res.blob();
      const filename =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        `${type}_export.xlsx`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi tải báo cáo");
    }
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Reports"
        title="Báo cáo và thống kê giáo dục"
        description="Tổng hợp học lực, điểm danh, tải giảng dạy, lịch kiểm tra và bộ dữ liệu xuất báo cáo cho vận hành nhà trường."
        actions={
          <>
            <ButtonLink href="/dashboard" tone="secondary">
              Xem tổng quan
            </ButtonLink>
            <Button
              tone="ghost"
              onClick={() => void refresh()}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? "Đang làm mới..." : "Làm mới"}
            </Button>
            <ButtonLink href={isAdmin ? "/students" : "/teaching-assignments"}>
              {isAdmin ? "Mở dữ liệu nguồn" : "Xem dữ liệu giảng dạy"}
            </ButtonLink>
            {isAdmin && (
              <>
                <Button
                  tone="secondary"
                  onClick={() => void downloadReport("students")}
                >
                  Xuất học sinh
                </Button>
                <Button
                  tone="secondary"
                  onClick={() => void downloadReport("teaching-assignments")}
                >
                  Xuất phân công
                </Button>
              </>
            )}
          </>
        }
      />

      {error ? (
        <Panel className="border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          {error}
        </Panel>
      ) : null}

      {/* Metrics */}
      <section className="grid gap-4 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <MetricSkeleton key={`report-metric-skeleton-${index}`} />
            ))
          : snapshot.reportMetrics
              .slice(0, 6)
              .map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      {/* Conduct + Academic rank */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {isLoading ? (
          <>
            <SectionSkeleton rows={4} />
            <SectionSkeleton rows={4} />
          </>
        ) : (
          <>
            <StatBarList
              title="Phân bố hạnh kiểm"
              description="Tổng hợp nhanh theo nhóm hạnh kiểm hiện tại của học sinh."
              items={snapshot.conductDistribution}
            />
            <StatBarList
              title="Phân bố học lực"
              description="Xếp nhóm theo điểm trung bình hiện tại để nhận biết tỷ lệ học sinh giỏi, khá và cần hỗ trợ."
              items={snapshot.academicRankDistribution}
            />
          </>
        )}
      </section>

      {/* Gender + Score status */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {isLoading ? (
          <>
            <SectionSkeleton rows={3} />
            <SectionSkeleton rows={4} />
          </>
        ) : (
          <>
            <DonutChart
              title="Cơ cấu giới tính"
              description="Tỷ trọng giới tính học sinh phục vụ báo cáo dân số học đường."
              items={snapshot.genderDistribution}
            />
            <DonutChart
              title="Tiến độ xử lý điểm"
              description="Theo dõi đầu điểm đang nhập, đã duyệt, đã công bố và khóa điểm."
              items={snapshot.scoreStatusDistribution}
            />
          </>
        )}
      </section>

      {/* Timelines */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {isLoading ? (
          <>
            <SectionSkeleton rows={5} />
            <SectionSkeleton rows={5} />
          </>
        ) : (
          <>
            <LineChart
              title="Tiến độ tổ chức kiểm tra"
              description="Số đợt kiểm tra phát sinh theo tháng, hỗ trợ điều phối lịch chung."
              points={snapshot.examTimeline}
              color="#22c55e"
            />
            <LineChart
              title="Điểm trung bình theo tháng"
              description="Trung bình điểm các bài kiểm tra theo thời gian, phục vụ đánh giá xu hướng chất lượng."
              points={snapshot.scoreTimeline}
              color="#0ea5e9"
            />
          </>
        )}
      </section>

      {/* Top students */}
      {isLoading ? (
        <SectionSkeleton rows={6} />
      ) : (
        <DataTable
          title="Học sinh xuất sắc"
          description="Bảng này mô phỏng dashboard top học sinh mà hội đồng rất hay thích xem ở phần demo."
          columns={["Mã học sinh", "Họ và tên", "Lớp", "Điểm TB", "Hạnh kiểm"]}
          rows={snapshot.topStudents.map((student) => [
            student.studentCode,
            student.fullName,
            student.className,
            student.scoreAverage,
            student.conduct,
          ])}
        />
      )}

      {/* Class performance + department load */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {isLoading ? (
          <>
            <SectionSkeleton rows={6} />
            <SectionSkeleton rows={4} />
          </>
        ) : (
          <>
            <DataTable
              title="Hiệu suất lớp học"
              description="Có thể dùng bảng này làm nền cho báo cáo học lực theo lớp và đối chiếu GVCN."
              columns={[
                "Lớp",
                "Năm học",
                "Sĩ số",
                "Điểm TB",
                "Tỷ lệ đạt",
                "GVCN",
              ]}
              rows={snapshot.classPerformance.map((item) => [
                item.className,
                item.academicYear,
                String(item.totalStudents),
                item.averageScore,
                item.passRate,
                item.homeroomTeacher,
              ])}
            />
            <DataTable
              title="Tải phân công theo bộ môn"
              description="Giúp đánh giá tổ chuyên môn nào đang gánh nhiều phân công giảng dạy trong năm học."
              columns={["Bộ môn", "Số giáo viên", "Số phân công"]}
              rows={snapshot.departmentLoad.map((item) => [
                item.department,
                String(item.teacherCount),
                String(item.assignmentCount),
              ])}
            />
          </>
        )}
      </section>

      {/* Teacher load + export catalog */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {isLoading ? (
          <>
            <SectionSkeleton rows={5} />
            <SectionSkeleton rows={4} />
          </>
        ) : (
          <>
            <DataTable
              title="Khối lượng giảng dạy giáo viên"
              description="Dùng để đối chiếu mức độ phân công của từng giáo viên và hỗ trợ cân bằng tải."
              columns={[
                "Mã GV",
                "Họ và tên",
                "Bộ môn",
                "Số phân công",
                "Chủ nhiệm",
              ]}
              rows={snapshot.teacherLoad.map((teacher) => [
                teacher.teacherCode,
                teacher.fullName,
                teacher.department,
                String(teacher.totalAssignments),
                teacher.homeroomClass,
              ])}
            />
            <DataTable
              title="Danh mục xuất báo cáo"
              description="Các gói xuất dữ liệu thông dụng trong quản trị nhà trường."
              columns={["Tên báo cáo", "Phạm vi", "Định dạng", "Nguồn dữ liệu"]}
              rows={snapshot.reportExports.map((report) => [
                report.reportName,
                report.scope,
                report.format,
                report.source,
              ])}
            />
          </>
        )}
      </section>
    </div>
  );
}
