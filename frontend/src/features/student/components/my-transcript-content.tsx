"use client";

import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { useMyStudentProfileData, useMyStudentTranscriptData } from "@/features/student/student-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

export function MyTranscriptContent() {
  const { student, source: profileSource, isLoading: profileLoading, error: profileError } = useMyStudentProfileData();
  const {
    transcript,
    transcriptOverview,
    source: transcriptSource,
    isLoading: transcriptLoading,
    error: transcriptError,
  } = useMyStudentTranscriptData();

  if (profileLoading || transcriptLoading) {
    return <div className="text-sm text-slate-500">Đang tải học bạ...</div>;
  }

  if (!student) {
    return (
      <EmptyState
        title="Không tìm thấy học bạ"
        description="Tài khoản hiện tại chưa được liên kết với hồ sơ học sinh."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Học bạ"
        title="Minh chứng học tập"
        description="Học bạ chính thức của bạn ghi nhận quá trình học tập qua các năm."
      />

      <StudentDataState source={profileSource} error={profileError} />
      <StudentDataState source={transcriptSource} error={transcriptError} />

      {/* Header Info */}
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Tên học sinh</p>
            <p className="mt-1 font-semibold text-slate-900">{student.fullName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Lớp</p>
            <p className="mt-1 font-semibold text-slate-900">{student.className}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Năm học</p>
            <p className="mt-1 font-semibold text-slate-900">{student.academicYear}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Trạng thái</p>
            <p className="mt-1 inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              {student.status}
            </p>
          </div>
        </div>
      </Panel>

      {/* Semesters */}
      {transcriptOverview.map((semester) => (
        <Panel key={semester.academicYear} className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">{semester.academicYear}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">GPA</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{semester.yearAverage}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Lớp</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{semester.className}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Kết quả</p>
              <p className="mt-2 font-bold text-slate-900">{semester.academicRank}</p>
            </div>
          </div>
        </Panel>
      ))}

      <Panel className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Chi tiết học bạ theo môn</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Môn học</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">HK I</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">HK II</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Cả năm</th>
              </tr>
            </thead>
            <tbody>
              {transcript.map((item) => (
                <tr key={item.subject} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-900">{item.subject}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.semester1}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.semester2}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{item.yearAverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          Bản học bạ này chỉ nhằm tham khảo. Để lấy bản chính thức, vui lòng liên hệ với
          phòng giáo dục.
        </p>
      </div>
    </div>
  );
}
