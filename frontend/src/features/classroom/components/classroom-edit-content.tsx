"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ClassroomForm } from "@/features/classroom/components/classroom-form";
import { useClassroomDetailData } from "@/features/classroom/classroom-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

export function ClassroomEditContent({ classCode }: { classCode: string }) {
  const { classroom, isLoading, error } = useClassroomDetailData(classCode);

  if (isLoading) {
    return <Panel className="p-6 text-sm text-slate-500">Đang tải lớp học để chỉnh sửa...</Panel>;
  }

  if (error || !classroom) {
    return (
      <EmptyState
        title="Không tìm thấy lớp học"
        description={error || "Vui lòng kiểm tra lại mã lớp."}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Classes / Edit"
        title={`Chỉnh sửa lớp • ${classroom.className}`}
        description="Cập nhật thông tin lớp học, năm học và giáo viên chủ nhiệm."
        actions={
          <>
            <Link
              href={`/classes/${classroom.classCode}`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Xem chi tiết
            </Link>
            <Link
              href="/classes"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>
          </>
        }
      />

      <ClassroomForm mode="edit" classroom={classroom} />
    </div>
  );
}
