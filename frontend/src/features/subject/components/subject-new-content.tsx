import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { SubjectForm } from "@/features/subject/components/subject-form";

export function SubjectNewContent() {
  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Subjects / Create"
        title="Tạo môn học mới"
        description="Thiết lập mã môn, bộ môn và khối áp dụng cho môn học."
        actions={
          <Link
            href="/subjects"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách
          </Link>
        }
      />

      <SubjectForm mode="create" />
    </div>
  );
}
