import Link from "next/link";
import type { ClassroomRecord } from "@/features/classroom/classroom-data";
import { Panel } from "@/shared/ui/panel";

export function ClassroomSummaryCard({
  classroom,
}: {
  classroom: ClassroomRecord;
}) {
  return (
    <Panel className="p-5">
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {classroom.academicYear}
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {classroom.className}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {classroom.grade} • GVCN: {classroom.homeroomTeacher}
            </p>
          </div>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
            {classroom.totalStudents} HS
          </span>
        </div>

        <div className="grid gap-2 text-sm text-slate-700">
          <p>Phòng học: {classroom.room}</p>
          <p>Buổi học: {classroom.shift}</p>
          <p>Trạng thái: {classroom.status}</p>
          <p>{classroom.notes}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/classes/${classroom.classCode}`}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Xem chi tiết lớp
          </Link>
          <Link
            href={`/classes/${classroom.classCode}/edit`}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Chỉnh sửa
          </Link>
          <Link
            href="/classes/promotion"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Xét lên lớp
          </Link>
        </div>
      </div>
    </Panel>
  );
}
