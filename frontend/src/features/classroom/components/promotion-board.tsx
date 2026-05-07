import { Panel } from "@/shared/ui/panel";
import type { PromotionPlan } from "@/features/classroom/classroom-data";

const actionLabels: Record<PromotionPlan["action"], string> = {
  promote: "Lên lớp",
  repeat: "Lưu ban",
  transfer: "Chuyển lớp",
  graduate: "Tốt nghiệp",
};

const statusLabels: Record<PromotionPlan["status"], string> = {
  draft: "Chờ duyệt",
  reviewed: "Đã rà soát",
  approved: "Đã duyệt",
};

const statusPanelStyles: Record<PromotionPlan["status"], string> = {
  draft: "border-amber-200 bg-gradient-to-b from-amber-50 to-white",
  reviewed: "border-cyan-200 bg-gradient-to-b from-cyan-50 to-white",
  approved: "border-emerald-200 bg-gradient-to-b from-emerald-50 to-white",
};

const statusTagStyles: Record<PromotionPlan["status"], string> = {
  draft: "bg-amber-100 text-amber-800",
  reviewed: "bg-cyan-100 text-cyan-800",
  approved: "bg-emerald-100 text-emerald-800",
};

const actionTagStyles: Record<PromotionPlan["action"], string> = {
  promote: "bg-emerald-100 text-emerald-800",
  repeat: "bg-amber-100 text-amber-800",
  transfer: "bg-sky-100 text-sky-800",
  graduate: "bg-violet-100 text-violet-800",
};

export function PromotionBoard({ plans }: { plans: PromotionPlan[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {(["draft", "reviewed", "approved"] as const).map((status) => (
        <Panel key={status} className={`p-5 ${statusPanelStyles[status]}`}>
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
                {statusLabels[status]}
              </p>
              <p className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTagStyles[status]}`}>
                {plans.filter((plan) => plan.status === status).length} hồ sơ
              </p>
            </div>

            <div className="grid gap-3">
              {plans.filter((plan) => plan.status === status).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
                  Chưa có hồ sơ ở trạng thái này.
                </div>
              ) : (
                plans
                  .filter((plan) => plan.status === status)
                  .map((plan) => (
                    <div
                      key={`${plan.studentCode}-${plan.status}`}
                      className="rounded-2xl border border-white/80 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-950">{plan.studentName}</p>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{plan.studentCode}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionTagStyles[plan.action]}`}>
                          {actionLabels[plan.action]}
                        </span>
                      </div>

                      <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
                        {plan.currentClass} → {plan.proposedClass}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">Năm học mục tiêu</p>
                      <p className="text-sm font-semibold text-slate-900">{plan.nextAcademicYear}</p>
                      <p className="mt-2 text-slate-600">{plan.reason}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
