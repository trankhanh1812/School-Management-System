"use client";

import Link from "next/link";
import { useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { useMyStudentScoresData } from "@/features/student/student-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

function scoreColor(value: number) {
  if (value >= 8.5) return "bg-emerald-50 text-emerald-800";
  if (value >= 7.5) return "bg-sky-50 text-sky-800";
  if (value >= 6.5) return "bg-amber-50 text-amber-800";
  return "bg-rose-50 text-rose-700";
}

function categoryLabel(category: string) {
  const map: Record<string, string> = {
    CHINH_THUC: "Chính thức",
    KHAO_SAT: "Khảo sát",
    chinh_thuc: "Chính thức",
    khao_sat: "Khảo sát",
    "Chính thức": "Chính thức",
    "Khảo sát": "Khảo sát",
  };
  return map[category] ?? category;
}

function examTypeLabel(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("miệng")) return "Miệng";
  if (lower.includes("15 phút") || lower.includes("15phut")) return "15 phút";
  if (lower.includes("1 tiết") || lower.includes("1tiet") || lower.includes("giữa kỳ"))
    return "1 tiết / GK";
  if (lower.includes("cuối kỳ") || lower.includes("cuoiky")) return "Cuối kỳ";
  return name;
}

export function MyScoresContent() {
  const { records, source, isLoading, error } = useMyStudentScoresData();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải bảng điểm...</div>;
  }

  if (records.length === 0 && error) {
    return (
      <EmptyState
        title="Không tìm thấy dữ liệu điểm"
        description="Hiện tại chưa có điểm số cho tài khoản học sinh này."
      />
    );
  }

  // Group by semester + academic year
  const groupedScores = records.reduce<Record<string, typeof records>>((acc, item) => {
    const key = `${item.semester} (${item.academicYear})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Điểm số"
        title="Bảng điểm của tôi"
        description="Xem điểm số theo từng môn học và học kỳ. Nhấn vào môn để xem chi tiết từng đầu điểm."
      />

      <StudentDataState source={source} error={error} />

      {/* Link to score history */}
      <Link
        href="/my-scores/history"
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        <span className="text-lg">📋</span>
        <span>Xem lịch sử thay đổi điểm</span>
        <span className="ml-auto text-slate-400">→</span>
      </Link>

      {Object.entries(groupedScores).map(([semesterKey, items]) => (
        <div key={semesterKey} className="grid gap-3">
          <h3 className="text-base font-semibold text-slate-900">{semesterKey}</h3>
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
                  const rowKey = `${semesterKey}-${subject.subject}`;
                  const isExpanded = expandedKey === rowKey;
                  const avg = Number.parseFloat(subject.officialAverage);
                  const officialAssessments = subject.assessments?.filter(
                    (a) => a.category === "CHINH_THUC" || a.category === "Chính thức",
                  ) ?? [];
                  const surveyAssessments = subject.assessments?.filter(
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
                          <span
                            className={`inline-block rounded-lg px-3 py-1 font-semibold ${scoreColor(avg)}`}
                          >
                            {subject.officialAverage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{subject.rank}</td>
                        <td className="px-4 py-3 text-center text-slate-400">
                          {isExpanded ? "▲" : "▼"}
                        </td>
                      </tr>

                      {/* Expanded detail rows */}
                      {isExpanded && (
                        <tr key={`${rowKey}-detail`} className="bg-slate-50">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="grid gap-4">
                              {/* Official assessments */}
                              {officialAssessments.length > 0 && (
                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Đầu điểm chính thức
                                  </p>
                                  <div className="grid gap-2">
                                    {officialAssessments.map((a, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2"
                                      >
                                        <div>
                                          <p className="font-medium text-slate-900">
                                            {examTypeLabel(a.assessmentName)} — {a.assessmentName}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            Hệ số {a.weight} · {a.recordedAt}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <span
                                            className={`inline-block rounded-lg px-3 py-1 text-sm font-semibold ${scoreColor(
                                              Number.parseFloat(a.score),
                                            )}`}
                                          >
                                            {a.score}
                                          </span>
                                          <p className="mt-1 text-xs text-slate-400">{a.status}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Survey assessments */}
                              {surveyAssessments.length > 0 && (
                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Điểm khảo sát (không tính học bạ)
                                  </p>
                                  <div className="grid gap-2">
                                    {surveyAssessments.map((a, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2 opacity-80"
                                      >
                                        <div>
                                          <p className="font-medium text-slate-700">{a.assessmentName}</p>
                                          <p className="text-xs text-slate-400">
                                            {categoryLabel(a.category)} · {a.recordedAt}
                                          </p>
                                        </div>
                                        <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                          {a.score}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {subject.assessments?.length === 0 && (
                                <p className="text-sm text-slate-500">Chưa có đầu điểm nào.</p>
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

      {records.length === 0 && !error && (
        <EmptyState
          title="Chưa có điểm số"
          description="Điểm số sẽ hiển thị sau khi giáo viên công bố."
        />
      )}

      <p className="text-xs text-slate-500">
        Chỉ hiển thị điểm đã được công bố. Nếu có sai sót, vui lòng liên hệ giáo viên bộ môn.
      </p>
    </div>
  );
}
