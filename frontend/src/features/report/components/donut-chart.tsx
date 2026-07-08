import { Panel } from "@/shared/ui/panel";
import type { DistributionItem } from "@/features/report/types";

type DonutChartProps = {
  title: string;
  description: string;
  items: DistributionItem[];
};

const palette = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

export function DonutChart({ title, description, items }: DonutChartProps) {
  const normalized = items
    .filter((item) => item.value > 0)
    .slice(0, 8)
    .map((item, index) => ({
      ...item,
      color: item.color ?? palette[index % palette.length],
    }));

  const total = normalized.reduce((sum, item) => sum + item.value, 0);
  const stops: string[] = [];
  let offset = 0;

  normalized.forEach((item) => {
    const ratio = total > 0 ? item.value / total : 0;
    const start = offset * 100;
    offset += ratio;
    const end = offset * 100;
    stops.push(`${item.color} ${start}% ${end}%`);
  });

  const gradient =
    stops.length > 0
      ? `conic-gradient(${stops.join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  return (
    <Panel className="p-5 sm:p-6">
      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-[200px_1fr] sm:items-center">
        <div className="mx-auto grid place-items-center">
          <div
            className="relative h-40 w-40 rounded-full"
            style={{ background: gradient }}
            aria-label={title}
            role="img"
          >
            <div className="absolute inset-[22%] grid place-items-center rounded-full bg-white text-center">
              <span className="text-xl font-bold text-slate-900">{total}</span>
              <span className="text-xs uppercase tracking-[0.1em] text-slate-500">
                Tổng
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {normalized.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu</p>
          ) : (
            normalized.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="font-semibold text-slate-900">{item.value}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}
