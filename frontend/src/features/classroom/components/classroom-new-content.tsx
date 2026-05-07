import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ClassroomForm } from "@/features/classroom/components/classroom-form";

export function ClassroomNewContent() {
  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Classes / Create"
        title="Tạo lớp học mới"
        description="Thiết lập lớp học theo năm học, khối lớp và giáo viên chủ nhiệm."
        actions={
          <Link
            href="/classes"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách
          </Link>
        }
      />

      <ClassroomForm mode="create" />
    </div>
  );
}
