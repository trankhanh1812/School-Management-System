"use client";

import { useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useChildScores, useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

function scoreColor(value: number) {
  if (value >= 8.5) return "bg-emerald-50 text-emerald-800";
  if (value >= 7.5) return "bg-sky-50 text-sky-800";
  if (value >= 6.5) return "bg-amber-50 text-amber-800";
  return "bg-rose-50 text-rose-700";
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    CHINH_THUC: "Chính thức", "Chính thức": "Chính thức",
    KHAO_SAT: "Khảo sát", "Khảo sát": "Khảo sát",
  };
  return map[cat] ?? cat;
}

export function ParentScoresContent() {
  const { children, isLoading: profileLoading } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (!selectedCode && children.length > 0 && children[0]) {
    setSelectedCode(children[0].studentCode);
  }

  const selectedChild = children.find((c) => c.studentCode === selectedCode);
  const canViewScore = selectedChild?.canViewScore !== false;

  const { records, isLoading, error } = useChildScores(canViewScore ? selectedCode : "");

  const grouped = records.reduce<Record<string, typeof records>>((acc, item) => {
    const key = `${item.semester} (${item.academicYear})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Điểm số"
        title="Bảng điểm của con"
        description="Xem điểm số theo từng môn học và học kỳ. Nhấn vào môn để xem chi tiết từng đầu điểm."
      />

      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn con</p>
        <ChildSelector children={children} selectedCode={selectedCode} onSelect={setSelectedCode} />
      </Panel>

      {!canViewScore && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Tài khoản của bạn không có quyền xem điểm số của học sinh này.
        </div>
      )}

      {canViewScore && (isLoading || profileLoading) && (
        <div className="text-sm text-slate-500">Đang tải bảng điểm...</div>
      )}

      {canViewScore && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {canViewScore && !isLoading && !error && records.length === 0 && selectedCode && (
        <EmptyState title="Chưa có điểm số" description="Điểm sẽ hiển thị sau khi giáo viên công bố." />
      )}

      {canViewScore && Object.entries(grouped).map(([semKey, items]) => (
        <div key={semKey} className="grid gap-3">
          <h3 className="text-base font-semibold text-slate-900">{semKey}</h3>
          <Panel className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Môn học</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Giáo viên</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">TB chính thức</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Xếp loại</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {items.map((subject) => {
                  const rowKey = `${semKey}-${subject.subject}`;
                  const isExpanded = expandedKey === rowKey;
                  const avg = Number.parseFloat(subject.officialAverage);
                  const official = subject.assessments?.filter(
                    (a) => a.category === "CHINH_THUC" || a.category === "Chính thức",
                  ) ?? [];
                  const survey = subject.assessments?.filter(
                    (a) => a.category !== "CHINH_THUC" && a.category !== "Chính thức",
                  ) ?? [];

                  return (
                    <>
                      <tr
                        key={rowKey}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setExpandedKey(isExpanded ? null : rowKey)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">{subject.subject}</td>
                        <td className="px-4 py-3 text-slate-600">{subject.teacher}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block rounded-lg px-3 py-1 font-semibold ${scoreColor(avg)}`}>
                            {subject.officialAverage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{subject.rank}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{isExpanded ? "▲" : "▼"}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${rowKey}-detail`} className="bg-slate-50">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="grid gap-4">
                              {official.length > 0 && (
                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Đầu điểm chính thức</p>
                                  <div className="grid gap-2">
                                    {official.map((a, idx) => (
                                      <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2">
                                        <div>
                                          <p className="font-medium text-slate-900">{a.assessmentName}</p>
                                          <p className="text-xs text-slate-500">Hệ số {a.weight} · {a.recordedAt}</p>
                                        </div>
                                        <div className="text-right">
                                          <span className={`inline-block rounded-lg px-3 py-1 text-sm font-semibold ${scoreColor(Number.parseFloat(a.score))}`}>
                                            {a.score}
                                          </span>
                                          <p className="mt-1 text-xs text-slate-400">{a.status}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {survey.length > 0 && (
                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Điểm khảo sát (không tính học bạ)</p>
                                  <div className="grid gap-2">
                                    {survey.map((a, idx) => (
                                      <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2 opacity-80">
                                        <div>
                                          <p className="font-medium text-slate-700">{a.assessmentName}</p>
                                          <p className="text-xs text-slate-400">{categoryLabel(a.category)} · {a.recordedAt}</p>
                                        </div>
                                        <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{a.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>
      ))}
    </div>
  );
}
