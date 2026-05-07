"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { TeachingCreateGridContent } from "./teaching-create-grid-content";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Panel } from "@/shared/ui/panel";

type TeachingNewContentProps = {
  sourceVersionId?: string;
};

export function TeachingNewContent({ sourceVersionId }: TeachingNewContentProps) {
  const { session } = useAuthSession();
  const isAdmin = session?.user.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="grid gap-4">
        <PageIntro
          eyebrow="Teaching / Timetable"
          title="Tạo thời khóa biểu"
          description="Bạn không có quyền truy cập chức năng này."
          actions={
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>
          }
        />
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Chỉ ADMIN mới được tạo thời khóa biểu.
        </Panel>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Teaching / Timetable"
        title="Tạo thời khóa biểu"
        description="Tạo một version thời khóa biểu mới. Bạn có thể nạp dữ liệu từ phiên bản cũ làm mẫu nhưng vẫn chỉnh sửa toàn bộ trước khi lưu."
        actions={
          <Link
            href="/schedule"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách
          </Link>
        }
      />

      <TeachingCreateGridContent initialVersionId={sourceVersionId} />
    </div>
  );
}
