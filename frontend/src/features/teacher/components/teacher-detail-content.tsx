"use client";

import Link from "next/link";
import { DataTable } from "@/features/dashboard/components/data-table";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useTeacherDetailData } from "@/features/teacher/teacher-client-data";
import { Panel } from "@/shared/ui/panel";

export function TeacherDetailContent({ teacherCode }: { teacherCode: string }) {
  const { teacher, isLoading, error } = useTeacherDetailData(teacherCode);

  if (isLoading) {
    return (
      <Panel className="p-6 text-sm text-slate-500">
        Đang tải hồ sơ giáo viên...
      </Panel>
    );
  }

  if (error || !teacher) {
    return (
      <Panel className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Không thể tải hồ sơ giáo viên: {error || "Không tìm thấy dữ liệu."}
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Teachers / Detail"
        title={`Hồ sơ giáo viên • ${teacher.fullName}`}
        description="Hiển thị hồ sơ chuyên môn, thông tin liên hệ và phân công giảng dạy của giáo viên."
        actions={
          <>
            <Link
              href={`/teachers/${teacher.teacherCode}/edit`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Chỉnh sửa hồ sơ
            </Link>
            <Link
              href="/teachers"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách giáo viên
            </Link>
            <Link
              href="/scores"
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Mở quản lý điểm
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5 sm:p-6">
          <div className="grid gap-3 text-sm text-slate-700">
            <p>Mã giáo viên: {teacher.teacherCode}</p>
            <p>Bộ môn: {teacher.department}</p>
            <p>Vai trò: {teacher.title}</p>
            <p>Điện thoại: {teacher.phone}</p>
            <p>Email: {teacher.email}</p>
            <p>Lớp chủ nhiệm: {teacher.homeroomClass ?? "Không có"}</p>
            <p>Trạng thái: {teacher.employmentStatus}</p>
            <p>Giới thiệu: {teacher.bio}</p>
          </div>
        </Panel>

        <DataTable
          title="Phân công giảng dạy"
          description="Một giáo viên có thể dạy nhiều môn, nhiều lớp và nhiều khối trong cùng năm học."
          columns={["Năm học", "Học kỳ", "Lớp", "Môn học", "Phòng", "Lịch dạy"]}
          rows={teacher.assignments.map((assignment) => [
            assignment.academicYear,
            assignment.semester,
            assignment.className,
            assignment.subject,
            assignment.room,
            assignment.periods,
          ])}
        />
      </section>
    </div>
  );
}
