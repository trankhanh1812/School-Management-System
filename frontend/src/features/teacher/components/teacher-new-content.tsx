import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { TeacherForm } from "@/features/teacher/components/teacher-form";

export function TeacherNewContent() {
  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Teachers / Create"
        title="Tạo hồ sơ giáo viên mới"
        description="Thiết lập thông tin cá nhân và bộ môn cho giáo viên để bắt đầu phân công giảng dạy."
        actions={
          <Link
            href="/teachers"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách
          </Link>
        }
      />

      <TeacherForm mode="create" />
    </div>
  );
}
