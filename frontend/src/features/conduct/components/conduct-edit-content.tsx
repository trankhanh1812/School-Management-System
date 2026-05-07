"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ConductForm } from "@/features/conduct/components/conduct-form";
import { useConductDetailData } from "@/features/conduct/conduct-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

export function ConductEditContent({ id }: { id: string }) {
  const { conduct, isLoading, error } = useConductDetailData(id);

  if (isLoading) {
    return <Panel className="p-6 text-sm text-slate-500">Đang tải bản ghi hạnh kiểm...</Panel>;
  }

  if (error || !conduct) {
    return (
      <EmptyState
        title="Không tìm thấy bản ghi hạnh kiểm"
        description={error || "Vui lòng kiểm tra lại mã bản ghi."}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Students / Conduct / Edit"
        title={`Chỉnh sửa hạnh kiểm • ${conduct.studentName ?? conduct.studentCode ?? ""}`}
        description="Cập nhật bản ghi hạnh kiểm theo đúng học kỳ để đảm bảo dữ liệu học sinh nhất quán xuyên suốt năm học."
        actions={
          <>
            <Link
              href="/students"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Về module Học sinh
            </Link>
          </>
        }
      />

      <ConductForm mode="edit" conduct={conduct} />
    </div>
  );
}
