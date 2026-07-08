import Link from "next/link";
import { useState } from "react";
import { teacherApi } from "@/features/teacher/api";
import type { TeacherRecord } from "@/features/teacher/teacher-data";
import { Panel } from "@/shared/ui/panel";

export function TeacherSummaryCard({
  teacher,
  onDeleted,
}: {
  teacher: TeacherRecord;
  onDeleted?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa hồ sơ giáo viên ${teacher.fullName}? Hành động này không thể hoàn tác.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await teacherApi.delete(teacher.teacherCode);
      onDeleted?.();
    } catch (error) {
      alert("Có lỗi khi xóa hồ sơ giáo viên");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Panel className="p-5">
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {teacher.teacherCode}
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {teacher.fullName}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {teacher.department} • {teacher.title}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {teacher.employmentStatus}
          </span>
        </div>

        <div className="grid gap-2 text-sm text-slate-700">
          <p>Email: {teacher.email}</p>
          <p>Điện thoại: {teacher.phone}</p>
          <p>Chủ nhiệm: {teacher.homeroomClass ?? "Không có"}</p>
          <p>Môn dạy: {teacher.subjects.join(", ")}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/teachers/${teacher.teacherCode}`}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Xem hồ sơ giáo viên
          </Link>
          <Link
            href={`/teachers/${teacher.teacherCode}/edit`}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Chỉnh sửa
          </Link>
          <Link
            href="/scores"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Xem phân công điểm
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
