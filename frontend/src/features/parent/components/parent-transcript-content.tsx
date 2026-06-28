"use client";

import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useChildTranscript, useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

export function ParentTranscriptContent() {
  const { children, isLoading: profileLoading } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();

  if (!selectedCode && children.length > 0 && children[0]) {
    setSelectedCode(children[0].studentCode);
  }

  const selectedChild = children.find((c) => c.studentCode === selectedCode);
  const { transcript, transcriptOverview, isLoading, error } = useChildTranscript(selectedCode);

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Học bạ"
        title="Học bạ của con"
        description="Kết quả học tập qua các năm học của con em."
      />

      <Panel className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn con</p>
        <ChildSelector children={children} selectedCode={selectedCode} onSelect={setSelectedCode} />
      </Panel>

      {(isLoading || profileLoading) && <div className="text-sm text-slate-500">Đang tải học bạ...</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {selectedChild && !isLoading && (
        <Panel className="p-5">
          <div className="grid gap-3 sm:grid-cols-4 text-sm">
            <div><p className="text-slate-500">Tên học sinh</p><p className="mt-0.5 font-semibold text-slate-900">{selectedChild.fullName}</p></div>
            <div><p className="text-slate-500">Lớp</p><p className="mt-0.5 font-semibold text-slate-900">{selectedChild.className}</p></div>
            <div><p className="text-slate-500">Năm học</p><p className="mt-0.5 font-semibold text-slate-900">{selectedChild.academicYear}</p></div>
            <div><p className="text-slate-500">Trạng thái</p>
              <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700">
                {selectedChild.status === "ACTIVE" ? "Đang học" : (selectedChild.status ?? "—")}
              </span>
            </div>
          </div>
        </Panel>
      )}

      {transcriptOverview.map((sem) => (
        <Panel key={sem.academicYear} className="p-5">
          <h3 className="text-base font-semibold text-slate-900">{sem.academicYear}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">GPA cả năm</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{sem.yearAverage}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Lớp</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{sem.className}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Học lực</p>
              <p className="mt-1 font-bold text-slate-800">{sem.academicRank}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Hạnh kiểm</p>
              <p className="mt-1 font-bold text-slate-800">{sem.conduct}</p>
            </div>
          </div>
        </Panel>
      ))}

      {transcript.length > 0 && (
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Chi tiết theo môn</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Môn học</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">HK I</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">HK II</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Cả năm</th>
              </tr>
            </thead>
            <tbody>
              {transcript.map((item) => (
                <tr key={item.subject} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{item.subject}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.semester1}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.semester2}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.yearAverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {!isLoading && !error && transcript.length === 0 && selectedCode && (
        <EmptyState title="Chưa có học bạ" description="Học bạ sẽ được cập nhật sau khi kết thúc năm học." />
      )}
    </div>
  );
}
