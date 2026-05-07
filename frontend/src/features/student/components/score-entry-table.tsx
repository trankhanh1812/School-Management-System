"use client";

import type { StudentRecord } from "@/features/student/student-data";
import { buildComputedSubjectResult } from "@/features/student/score-utils";
import { Panel } from "@/shared/ui/panel";

type ScoreEntryTableProps = {
  student: StudentRecord;
  subjectResults: StudentRecord["subjectResults"];
  onScoreChange: (
    subjectKey: string,
    assessmentName: string,
    nextScore: string,
  ) => void;
};

export function ScoreEntryTable({
  student,
  subjectResults,
  onScoreChange,
}: ScoreEntryTableProps) {
  return (
    <div className="grid gap-4">
      {subjectResults.map((subjectResult) => {
        const computedResult = buildComputedSubjectResult(subjectResult);
        const subjectKey = `${subjectResult.academicYear}-${subjectResult.semester}-${subjectResult.subject}`;

        return (
          <Panel
            key={`${student.studentCode}-${subjectResult.subject}`}
            className="overflow-hidden"
          >
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                    {subjectResult.subject}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {subjectResult.semester} • Giáo viên phụ trách:{" "}
                    {subjectResult.teacher}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    Điểm chính thức: {computedResult.officialAverage}
                  </span>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 font-semibold text-cyan-700">
                    Khảo sát: {computedResult.surveyAverage}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    Xếp loại: {computedResult.rank}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
                Quy tắc đang dùng: điểm trung bình môn = tổng các điểm chính thức
                theo trọng số. Xếp loại môn: Giỏi {"≥"} 8, Khá {"≥"} 6.5, Trung bình
                {" ≥"} 5, còn lại là Cần hỗ trợ.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold sm:px-6">Đầu điểm</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Loại</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Trọng số</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Điểm</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Người nhập</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Thời gian</th>
                    <th className="px-5 py-4 font-semibold sm:px-6">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectResult.assessments.map((assessment) => (
                    <tr
                      key={`${student.studentCode}-${subjectResult.subject}-${assessment.assessmentName}`}
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-4 text-slate-700 sm:px-6">
                        {assessment.assessmentName}
                      </td>
                      <td className="px-5 py-4 text-slate-700 sm:px-6">
                        {assessment.category}
                      </td>
                      <td className="px-5 py-4 text-slate-700 sm:px-6">
                        {assessment.weight}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <input
                          defaultValue={assessment.score}
                          onChange={(event) =>
                            onScoreChange(
                              subjectKey,
                              assessment.assessmentName,
                              event.target.value,
                            )
                          }
                          className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-700 sm:px-6">
                        {assessment.recordedBy}
                      </td>
                      <td className="px-5 py-4 text-slate-700 sm:px-6">
                        {assessment.recordedAt}
                      </td>
                      <td className="px-5 py-4 text-slate-700 sm:px-6">
                        {assessment.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
