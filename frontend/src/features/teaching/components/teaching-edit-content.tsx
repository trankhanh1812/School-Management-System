"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { TeachingForm } from "@/features/teaching/components/teaching-form";
import { useTeachingDetailData } from "@/features/teaching/teaching-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

export function TeachingEditContent({ assignmentId }: { assignmentId: string }) {
  const { assignment, isLoading, error } = useTeachingDetailData(assignmentId);

  if (isLoading) {
    return <Panel className="p-6 text-sm text-slate-500">Đang tải phân công để chỉnh sửa...</Panel>;
  }

  if (error || !assignment) {
    return <EmptyState title="Không tìm thấy phân công" description={error || "Vui lòng kiểm tra lại id."} />;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Teaching / Edit"
        title={`Chỉnh sửa phân công • ${assignment.teacherName} - ${assignment.className}`}
        description="Cập nhật giáo viên, lớp, môn học và học kỳ giảng dạy."
        actions={
          <Link
            href="/teaching-assignments"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách
          </Link>
        }
      />

      <TeachingForm mode="edit" assignment={assignment} />
    </div>
  );
}
