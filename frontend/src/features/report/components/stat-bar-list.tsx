import { Panel } from "@/shared/ui/panel";

type StatBarItem = {
  label: string;
  value: number;
};

export function StatBarList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: StatBarItem[];
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Panel className="p-5 sm:p-6">
      <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <div key={item.label} className="grid gap-2">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-cyan-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
