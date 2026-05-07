"use client";

import Link from "next/link";
import { DataTable } from "@/features/dashboard/components/data-table";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useClassroomDetailData } from "@/features/classroom/classroom-client-data";
import { Panel } from "@/shared/ui/panel";

export function ClassroomDetailContent({ classCode }: { classCode: string }) {
  const { classroom, students, promotionPlans, isLoading, error } = useClassroomDetailData(classCode);

  if (isLoading) {
    return <Panel className="p-6 text-sm text-slate-500">Đang tải chi tiết lớp...</Panel>;
  }

  if (error || !classroom) {
    return (
      <Panel className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Không thể tải chi tiết lớp học: {error || "Không tìm thấy lớp."}
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Classes / Detail"
        title={`Chi tiết lớp • ${classroom.className}`}
        description="Trang này nối lớp học với sĩ số, GVCN, danh sách học sinh và đề án lên lớp cho năm học tiếp theo."
        actions={
          <>
            <Link
              href={`/classes/${classroom.classCode}/edit`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Chỉnh sửa lớp
            </Link>
            <Link
              href="/classes/promotion"
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Xét lên lớp
            </Link>
            <Link
              href="/classes"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách lớp
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5 sm:p-6">
          <div className="grid gap-3 text-sm text-slate-700">
            <p>Năm học: {classroom.academicYear}</p>
            <p>Khối: {classroom.grade}</p>
            <p>GVCN: {classroom.homeroomTeacher}</p>
            <p>Phòng học: {classroom.room}</p>
            <p>Buổi học: {classroom.shift}</p>
            <p>Trạng thái: {classroom.status}</p>
            <p>Ghi chú: {classroom.notes}</p>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            Tóm tắt xét lớp năm tiếp theo
          </h3>
          <div className="mt-4 grid gap-3">
            {promotionPlans.map((plan) => (
              <div
                key={`${plan.studentCode}-${plan.status}`}
                className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700"
              >
                <p className="font-semibold text-slate-950">{plan.studentName}</p>
                <p className="mt-1">
                  {plan.currentClass} → {plan.proposedClass} ({plan.nextAcademicYear})
                </p>
                <p className="mt-1">Lý do: {plan.reason}</p>
                <p className="mt-1">Trạng thái: {plan.status}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <DataTable
        title="Danh sách học sinh của lớp"
        description="Danh sách học sinh theo lớp, phục vụ theo dõi học lực và công tác chủ nhiệm."
        columns={["Mã học sinh", "Họ và tên", "Hạnh kiểm", "Điểm TB", "Trạng thái"]}
        rows={students.map((student) => [
          student.studentCode,
          student.fullName,
          student.conduct,
          student.scoreAverage,
          student.status,
        ])}
      />
    </div>
  );
}
