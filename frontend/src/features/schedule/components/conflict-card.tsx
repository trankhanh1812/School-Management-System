import type { ScheduleConflict } from "@/features/schedule/schedule-data";
import { Panel } from "@/shared/ui/panel";

const severityClasses: Record<ScheduleConflict["severity"], string> = {
  high: "bg-rose-50 text-rose-700",
  medium: "bg-amber-50 text-amber-700",
};

const typeLabels: Record<ScheduleConflict["type"], string> = {
  teacher: "Conflict giáo viên",
  classroom: "Conflict lớp học",
  room: "Conflict phòng học",
};

export function ConflictCard({ conflict }: { conflict: ScheduleConflict }) {
  return (
    <Panel className="p-5">
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {typeLabels[conflict.type]}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {conflict.title}
            </h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${severityClasses[conflict.severity]}`}>
            {conflict.severity === "high" ? "Cao" : "Trung bình"}
          </span>
        </div>

        <p className="text-sm leading-7 text-slate-700">{conflict.description}</p>

        <div className="flex flex-wrap gap-2">
          {conflict.affectedItems.map((item) => (
            <span
              key={`${conflict.id}-${item}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-slate-700">
          Gợi ý xử lý: {conflict.recommendation}
        </div>
      </div>
    </Panel>
  );
}
