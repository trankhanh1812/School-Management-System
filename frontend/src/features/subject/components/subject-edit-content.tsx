"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { SubjectForm } from "@/features/subject/components/subject-form";
import { useSubjectDetailData } from "@/features/subject/subject-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

export function SubjectEditContent({ subjectCode }: { subjectCode: string }) {
  const { subject, isLoading, error } = useSubjectDetailData(subjectCode);

  if (isLoading) {
    return <Panel className="p-6 text-sm text-slate-500">Đang tải môn học để chỉnh sửa...</Panel>;
  }

  if (error || !subject) {
    return <EmptyState title="Không tìm thấy môn học" description={error || "Vui lòng kiểm tra lại mã môn."} />;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Subjects / Edit"
        title={`Chỉnh sửa môn học • ${subject.name}`}
        description="Cập nhật thông tin môn học và bộ môn phụ trách."
        actions={
          <Link
            href="/subjects"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách
          </Link>
        }
      />

      <SubjectForm mode="edit" subject={subject} />
    </div>
  );
}
