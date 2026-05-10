"use client";

import { useMemo } from "react";
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

export default function DashboardPage() {
  const { session } = useAuthSession();
  const isStudent = session?.user.role === "STUDENT";
  const { snapshot, isLoading, isRefreshing, error, refresh } =
    useEducationAnalytics();

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
        description="Tong hop KPI, hoc luc, diem danh, lich kiem tra va canh bao hoc vu theo du lieu that trong he thong nha truong."
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

      <section className="grid gap-4 xl:grid-cols-4">
        {(isLoading ? [] : snapshot.reportMetrics.slice(0, 4)).map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Panel
                key={`metric-skeleton-${index}`}
                className="h-[152px] animate-pulse bg-slate-100/80"
              >
                <div />
              </Panel>
            ))
          : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <LineChart
          title="Xu huong diem trung binh theo dot kiem tra"
          description="Duong xu huong nay cho thay bien dong chat luong hoc tap theo tung thang co bai kiem tra."
          points={snapshot.scoreTimeline}
          color="#0ea5e9"
        />

        <Panel className="p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            Canh bao hoc vu uu tien
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
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DonutChart
          title="Trang thai diem"
          description="Theo doi pipeline nhap diem va cong bo diem."
          items={snapshot.scoreStatusDistribution}
        />
        <DonutChart
          title="Trang thai diem danh"
          description="Ty trong co mat, di muon, vang va co phep."
          items={snapshot.attendanceDistribution}
        />
        <StatBarList
          title="Xep hang hoc luc"
          description="Phan bo hoc sinh theo nhom diem trung binh toan cuc."
          items={snapshot.academicRankDistribution}
        />
      </section>

      <DataTable
        title="Top hoc sinh noi bat"
        description="Danh sach hoc sinh co diem trung binh cao nhat hien tai de ban giam hieu theo doi."
        columns={["Ma hoc sinh", "Ho va ten", "Lop", "Diem TB", "Hanh kiem"]}
        rows={snapshot.topStudents.map((student) => [
          student.studentCode,
          student.fullName,
          student.className,
          student.scoreAverage,
          student.conduct,
        ])}
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTable
          title="Hieu suat lop hoc"
          description="So sanh quy mo lop, diem trung binh va ty le dat theo tung lop."
          columns={["Lop", "Nam hoc", "Si so", "Diem TB", "Ty le dat", "GVCN"]}
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
          title="Lich dot kiem tra theo thang"
          description="So dot kiem tra duoc lap theo thang, ho tro dieu phoi lich thi va nhap diem."
          points={snapshot.examTimeline}
          color="#22c55e"
        />
      </section>
    </div>
  );
}
