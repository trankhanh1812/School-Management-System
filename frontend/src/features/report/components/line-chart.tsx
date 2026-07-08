import { Panel } from "@/shared/ui/panel";
import type { TrendPoint } from "@/features/report/types";

type LineChartProps = {
  title: string;
  description: string;
  points: TrendPoint[];
  color?: string;
};

function buildPolyline(
  points: TrendPoint[],
  width: number,
  height: number,
  padding: number,
) {
  if (points.length === 0) {
    return "";
  }

  const values = points.map((item) => item.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step =
    points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  return points
    .map((item, index) => {
      const x = padding + step * index;
      const y =
        height -
        padding -
        ((item.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function LineChart({
  title,
  description,
  points,
  color = "#0ea5e9",
}: LineChartProps) {
  const chartWidth = 640;
  const chartHeight = 260;
  const padding = 24;
  const polyline = buildPolyline(points, chartWidth, chartHeight, padding);

  return (
    <Panel className="p-5 sm:p-6">
      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      {points.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          Chưa có dữ liệu theo chuỗi thời gian
        </p>
      ) : (
        <div className="mt-5">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-64 w-full"
            aria-label={title}
            role="img"
          >
            <rect
              x="0"
              y="0"
              width={chartWidth}
              height={chartHeight}
              fill="transparent"
            />
            {[0, 1, 2, 3].map((tick) => {
              const y = padding + ((chartHeight - padding * 2) * tick) / 3;
              return (
                <line
                  key={`grid-${tick}`}
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}
            <polyline
              points={polyline}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {polyline
              .split(" ")
              .filter(Boolean)
              .map((point, index) => {
                const [x, y] = point.split(",");
                return (
                  <circle
                    key={`point-${index}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                  />
                );
              })}
          </svg>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4 lg:grid-cols-8">
            {points.map((point) => (
              <div
                key={`${point.label}-${point.value}`}
                className="rounded-lg border border-slate-200 bg-white/70 px-2 py-1"
              >
                <p className="font-medium text-slate-700">{point.label}</p>
                <p>{point.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
