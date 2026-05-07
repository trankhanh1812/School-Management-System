"use client";

import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useChildConduct, useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

const CONDUCT_CONFIG: Record<string, { label: string; cls: string }> = {
  EXCELLENT: { label: "Tốt",        cls: "bg-green-100 text-green-900" },
  GOOD:      { label: "Khá",        cls: "bg-blue-100 text-blue-900" },
  AVERAGE:   { label: "Trung bình", cls: "bg-yellow-100 text-yellow-900" },
  WEAK:      { label: "Yếu",        cls: "bg-red-100 text-red-900" },
  Tốt:       { label: "Tốt",        cls: "bg-green-100 text-green-900" },
  Khá:       { label: "Khá",        cls: "bg-blue-100 text-blue-900" },
  "Trung bình": { label: "Trung bình", cls: "bg-yellow-100 text-yellow-900" },
  Yếu:       { label: "Yếu",        cls: "bg-red-100 text-red-900" },
};

function ConductBadge({ level }: { level?: string }) {
  const cfg = level ? (CONDUCT_CONFIG[level] ?? null) : null;
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${cfg?.cls ?? "bg-slate-100 text-slate-600"}`}>
      {cfg?.label ?? level ?? "Chưa đánh giá"}
    </span>
  );
}

export function ParentConductContent() {
  const { children, isLoading: profileLoading } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();

  if (!selectedCode && children.length > 0 && children[0]) {
    setSelectedCode(children[0].studentCode);
  }

  const { records, isLoading, error } = useChildConduct(selectedCode);

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Hạnh kiểm"
        title="Hạnh kiểm của con"
        description="Kết quả đánh giá hạnh kiểm theo từng học kỳ do giáo viên chủ nhiệm ghi nhận."
      />

      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn con</p>
        <ChildSelector children={children} selectedCode={selectedCode} onSelect={setSelectedCode} />
      </Panel>

      {(isLoading || profileLoading) && <div className="text-sm text-slate-500">Đang tải hạnh kiểm...</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!isLoading && !error && records.length === 0 && selectedCode && (
        <EmptyState title="Chưa có dữ liệu hạnh kiểm" description="Hạnh kiểm sẽ được cập nhật sau khi giáo viên chủ nhiệm đánh giá cuối học kỳ." />
      )}

      {records.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((r, idx) => (
              <Panel key={idx} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{r.semesterCode} · {r.academicYearCode}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">{r.className}</p>
                  </div>
                  <ConductBadge level={r.conductLevel} />
                </div>
                {r.remarks && <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">{r.remarks}</p>}
                {r.assessedByName && <p className="mt-2 text-xs text-slate-400">GVCN: {r.assessedByName}</p>}
              </Panel>
            ))}
          </div>

          <Panel className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Học kỳ</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Năm học</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Lớp</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Hạnh kiểm</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{r.semesterCode}</td>
                    <td className="px-4 py-3 text-slate-700">{r.academicYearCode}</td>
                    <td className="px-4 py-3 text-slate-700">{r.className}</td>
                    <td className="px-4 py-3"><ConductBadge level={r.conductLevel} /></td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{r.remarks || <span className="text-slate-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </>
      )}
    </div>
  );
}
