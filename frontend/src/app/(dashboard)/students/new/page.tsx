import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentForm } from "@/features/student/components/student-form";

export default function NewStudentPage() {
  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Students / Create"
        title="Tạo hồ sơ học sinh mới"
        description="Form này đã tách sẵn các khối dữ liệu cá nhân, học tập và phụ huynh để sau này nối vào các bảng student, student-class và parent-student."
        actions={
          <Link
            href="/students"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách
          </Link>
        }
      />

      <StudentForm mode="create" />
    </div>
  );
}
