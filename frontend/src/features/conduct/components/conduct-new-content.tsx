import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ConductForm } from "@/features/conduct/components/conduct-form";

export function ConductNewContent() {
  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Students / Conduct / Create"
        title="Tạo bản ghi hạnh kiểm"
        description="Nhập hạnh kiểm theo học kỳ ngay trong luồng quản lý học sinh để đồng bộ học bạ và theo dõi tiến bộ."
        actions={
          <Link
            href="/students"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Về module Học sinh
          </Link>
        }
      />

      <ConductForm mode="create" />
    </div>
  );
}
