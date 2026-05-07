import { Panel } from "@/shared/ui/panel";

type MetricCardProps = {
  label: string;
  value: string;
  trend: string;
  note: string;
};

export function MetricCard({ label, value, trend, note }: MetricCardProps) {
  return (
    <Panel className="p-5">
      <div className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <div className="flex items-end justify-between gap-4">
          <p className="text-4xl font-bold tracking-tight text-slate-950">{value}</p>
          <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
            {trend}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{note}</p>
      </div>
    </Panel>
  );
}
