import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StudentRecord } from "@/features/student/student-data";
import { studentApi } from "@/features/student/api";
import { Panel } from "@/shared/ui/panel";

export function StudentSummaryCard({ student }: { student: StudentRecord }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ học sinh ${student.fullName}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await studentApi.delete(student.studentCode);
      router.refresh();
    } catch (error) {
      alert("Có lỗi khi xóa hồ sơ học sinh");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Panel className="p-5">
      <div className="grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-semibold text-cyan-800">
              {student.avatarLabel}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {student.studentCode}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                {student.fullName}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {student.className} • {student.academicYear} • {student.status}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            TB {student.scoreAverage}
          </span>
        </div>

        <div className="grid gap-2 text-sm text-slate-600">
          <p>GVCN: {student.homeroomTeacher}</p>
          <p>Hạnh kiểm: {student.conduct}</p>
          <p>Liên hệ: {student.phone}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/students/${student.studentCode}`}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Xem hồ sơ
          </Link>
          <Link
            href={`/students/${student.studentCode}/edit`}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Chỉnh sửa
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-full border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </Panel>
  );
}
