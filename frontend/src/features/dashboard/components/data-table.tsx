import type { ReactNode } from "react";
import { Panel } from "@/shared/ui/panel";

type DataTableProps = {
  title: string;
  description: string;
  columns: string[];
  rows: ReactNode[][];
};

export function DataTable({
  title,
  description,
  columns,
  rows,
}: DataTableProps) {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-sky-100 px-5 py-5 sm:px-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="max-h-[68vh] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-sky-50/95 text-slate-500 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.08em] sm:px-6">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6" colSpan={columns.length}>
                  Không có dữ liệu để hiển thị.
                </td>
              </tr>
            ) : null}
            {rows.map((row, rowIndex) => (
              <tr
                key={`${title}-${rowIndex}`}
                className={`border-t border-sky-50 transition hover:bg-sky-50/60 ${
                  rowIndex % 2 === 1 ? "bg-slate-50/25" : ""
                }`}
              >
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${rowIndex}-${cellIndex}`} className="px-5 py-4 text-slate-700 sm:px-6">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
