"use client";

import { useEffect, useMemo } from "react";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { DataTable } from "@/features/dashboard/components/data-table";
import { DonutChart } from "@/features/report/components/donut-chart";
import { LineChart } from "@/features/report/components/line-chart";
import { StatBarList } from "@/features/report/components/stat-bar-list";
import { useEducationAnalytics } from "@/features/report/hooks";
import { Panel } from "@/shared/ui/panel";
import { Button, ButtonLink } from "@/shared/ui/button";
import { useAuthSession } from "@/hooks";
import { StudentDashboard } from "@/features/student/components/student-dashboard-content";

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

export default function DashboardPage() {
  const { session } = useAuthSession();
  const isStudent = session?.user.role === "STUDENT";
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

  const riskTone = useMemo(
    () => ({
      high: "border-rose-200 bg-rose-50 text-rose-800",
      medium: "border-amber-200 bg-amber-50 text-amber-800",
      low: "border-emerald-200 bg-emerald-50 text-emerald-800",
    }),
    [],
  );

  if (isStudent) {
    return <StudentDashboard />;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Dashboard"
        title="Trung tâm điều hành giáo dục"
        description="Tổng hợp KPI, học lực, điểm danh, lịch kiểm tra và cảnh báo học vụ theo dữ liệu thật trong hệ thống nhà trường."
        actions={
          <>
            <ButtonLink href="/reports" tone="secondary">
              Xem báo cáo
            </ButtonLink>
            <Button
              tone="ghost"
              onClick={() => void refresh()}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? "Đang làm mới..." : "Làm mới dữ liệu"}
            </Button>
            <ButtonLink href="/notifications">Gửi thông báo</ButtonLink>
          </>
        }
      />

      {error ? (
        <Panel className="border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          {error}
        </Panel>
      ) : null}

      {/* Metrics row */}
      <section className="grid gap-4 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <MetricSkeleton key={`metric-skeleton-${index}`} />
            ))
          : snapshot.reportMetrics
              .slice(0, 4)
              .map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      {/* Charts row */}
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {isLoading ? (
          <>
            <SectionSkeleton rows={5} />
            <SectionSkeleton rows={4} />
          </>
        ) : (
          <>
            <LineChart
              title="Xu hướng điểm trung bình theo đợt kiểm tra"
              description="Đường xu hướng này cho thấy biến động chất lượng học tập theo từng tháng có bài kiểm tra."
              points={snapshot.scoreTimeline}
              color="#0ea5e9"
            />
            <Panel className="p-5 sm:p-6">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                Cảnh báo học vụ ưu tiên
              </h3>
              <div className="mt-5 grid gap-3">
                {snapshot.riskAlerts.map((item) => (
                  <div
                    key={`${item.title}-${item.detail}`}
                    className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${riskTone[item.severity]}`}
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
      </section>

      {/* Distribution charts */}
      <section className="grid gap-4 xl:grid-cols-3">
        {isLoading ? (
          <>
            <SectionSkeleton rows={4} />
            <SectionSkeleton rows={4} />
            <SectionSkeleton rows={4} />
          </>
        ) : (
          <>
            <DonutChart
              title="Trạng thái điểm"
              description="Theo dõi pipeline nhập điểm và công bố điểm."
              items={snapshot.scoreStatusDistribution}
            />
            <DonutChart
              title="Trạng thái điểm danh"
              description="Tỷ trọng có mặt, đi muộn, vắng và có phép."
              items={snapshot.attendanceDistribution}
            />
            <StatBarList
              title="Xếp hạng học lực"
              description="Phân bổ học sinh theo nhóm điểm trung bình toàn cục."
              items={snapshot.academicRankDistribution}
            />
          </>
        )}
      </section>

      {/* Top students table */}
      {isLoading ? (
        <SectionSkeleton rows={6} />
      ) : (
        <DataTable
          title="Top học sinh nổi bật"
          description="Danh sách học sinh có điểm trung bình cao nhất hiện tại để ban giám hiệu theo dõi."
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

      {/* Class performance + exam timeline */}
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {isLoading ? (
          <>
            <SectionSkeleton rows={6} />
            <SectionSkeleton rows={5} />
          </>
        ) : (
          <>
            <DataTable
              title="Hiệu suất lớp học"
              description="So sánh quy mô lớp, điểm trung bình và tỷ lệ đạt theo từng lớp."
              columns={[
                "Lớp",
                "Năm học",
                "Sĩ số",
                "Điểm TB",
                "Tỷ lệ đạt",
                "GVCN",
              ]}
              rows={snapshot.classPerformance
                .slice(0, 12)
                .map((item) => [
                  item.className,
                  item.academicYear,
                  String(item.totalStudents),
                  item.averageScore,
                  item.passRate,
                  item.homeroomTeacher,
                ])}
            />
            <LineChart
              title="Lịch đợt kiểm tra theo tháng"
              description="Số đợt kiểm tra được lập theo tháng, hỗ trợ điều phối lịch thi và nhập điểm."
              points={snapshot.examTimeline}
              color="#22c55e"
            />
          </>
        )}
      </section>
    </div>
  );
}
