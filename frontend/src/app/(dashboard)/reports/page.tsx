"use client";

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

export default function ReportsPage() {
  const { session } = useAuthSession();
  const isAdmin = session?.user.role === "ADMIN";
  const { snapshot, isLoading, isRefreshing, error, refresh } = useEducationAnalytics();

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Reports"
        title="Báo cáo và thống kê giáo dục"
        description="Tong hop hoc luc, diem danh, tai giang day, lich kiem tra va bo du lieu xuat bao cao cho van hanh nha truong."
        actions={
          <>
            <ButtonLink href="/dashboard" tone="secondary">
              Xem tổng quan
            </ButtonLink>
            <Button tone="ghost" onClick={() => void refresh()} disabled={isLoading || isRefreshing}>
              {isRefreshing ? "Đang làm mới..." : "Làm mới"}
            </Button>
            <ButtonLink href={isAdmin ? "/students" : "/teaching-assignments"}>
              {isAdmin ? "Mở dữ liệu nguồn" : "Xem dữ liệu giảng dạy"}
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <Panel className="border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">{error}</Panel>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {(isLoading ? [] : snapshot.reportMetrics.slice(0, 6)).map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Panel key={`report-metric-skeleton-${index}`} className="h-[152px] animate-pulse bg-slate-100/80">
                <div />
              </Panel>
            ))
          : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
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
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DonutChart
          title="Cau truc gioi tinh"
          description="Ty trong gioi tinh hoc sinh phuc vu bao cao dan so hoc duong."
          items={snapshot.genderDistribution}
        />
        <DonutChart
          title="Tien do xu ly diem"
          description="Theo doi dau diem dang nhap, da duyet, da cong bo va khoa diem."
          items={snapshot.scoreStatusDistribution}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <LineChart
          title="Tien do to chuc kiem tra"
          description="So dot kiem tra phat sinh theo thang, ho tro dieu phoi lich chung."
          points={snapshot.examTimeline}
          color="#22c55e"
        />
        <LineChart
          title="Diem trung binh theo thang"
          description="Trung binh diem cac bai kiem tra theo thoi gian, phuc vu danh gia xu huong chat luong."
          points={snapshot.scoreTimeline}
          color="#0ea5e9"
        />
      </section>

      <DataTable
        title="Top học sinh"
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

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DataTable
          title="Hiệu suất lớp học"
          description="Có thể dùng bảng này làm nền cho báo cáo học lực theo lớp và đối chiếu GVCN."
          columns={["Lớp", "Năm học", "Sĩ số", "Điểm TB", "Tỷ lệ đạt", "GVCN"]}
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
          description="Giúp đánh giá tổ chuyên môn nào đang gánh nhiều teaching assignment trong năm học."
          columns={["Bộ môn", "Số giáo viên", "Số assignment"]}
          rows={snapshot.departmentLoad.map((item) => [
            item.department,
            String(item.teacherCount),
            String(item.assignmentCount),
          ])}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DataTable
          title="Khối lượng giảng dạy giáo viên"
          description="Dùng để đối chiếu mức độ phân công của từng giáo viên và hỗ trợ cân bằng tải."
          columns={["Mã GV", "Họ và tên", "Bộ môn", "Số assignment", "Chủ nhiệm"]}
          rows={snapshot.teacherLoad.map((teacher) => [
            teacher.teacherCode,
            teacher.fullName,
            teacher.department,
            String(teacher.totalAssignments),
            teacher.homeroomClass,
          ])}
        />

        <DataTable
          title="Danh muc export bao cao"
          description="Cac goi xuat du lieu thong dung trong quan tri nha truong."
          columns={["Tên báo cáo", "Phạm vi", "Định dạng", "Nguồn dữ liệu"]}
          rows={snapshot.reportExports.map((report) => [
            report.reportName,
            report.scope,
            report.format,
            report.source,
          ])}
        />
      </section>
    </div>
  );
}
