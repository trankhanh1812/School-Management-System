"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { TeacherForm } from "@/features/teacher/components/teacher-form";
import { useTeacherDetailData } from "@/features/teacher/teacher-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

export function TeacherEditContent({ teacherCode }: { teacherCode: string }) {
  const { teacher, isLoading, error } = useTeacherDetailData(teacherCode);

  if (isLoading) {
    return <Panel className="p-6 text-sm text-slate-500">Đang tải hồ sơ để chỉnh sửa...</Panel>;
  }

  if (error || !teacher) {
    return (
      <EmptyState
        title="Không tìm thấy hồ sơ giáo viên"
        description={error || "Vui lòng kiểm tra lại mã giáo viên."}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Teachers / Edit"
        title={`Chỉnh sửa hồ sơ • ${teacher.fullName}`}
        description="Cập nhật thông tin giáo viên, bộ môn và trạng thái công tác."
        actions={
          <>
            <Link
              href={`/teachers/${teacher.teacherCode}`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Xem hồ sơ
            </Link>
            <Link
              href="/teachers"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>
          </>
        }
      />

      <TeacherForm mode="edit" teacher={teacher} />
    </div>
  );
}
