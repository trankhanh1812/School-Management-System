"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { StudentTranscriptView } from "@/features/student/components/student-transcript-view";
import { useStudentDetailData } from "@/features/student/student-client-data";
import { EmptyState } from "@/shared/components/empty-state";

export function StudentTranscriptContent({ studentCode }: { studentCode: string }) {
  const { student, source, isLoading, error } = useStudentDetailData(studentCode);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải học bạ điện tử...</div>;
  }

  if (!student) {
    return (
      <EmptyState
        title="Không tìm thấy học bạ"
        description="Chưa có dữ liệu học sinh tương ứng để hiển thị học bạ điện tử."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Students / Transcript"
        title={`Học bạ điện tử • ${student.fullName}`}
        description="Trang này mô phỏng sổ học bạ điện tử cho học sinh và phụ huynh: xem kết quả toàn năm, từng học kỳ, xếp loại, hạnh kiểm và chuyên cần."
        actions={
          <>
            <Link
              href={`/students/${student.studentCode}/scores`}
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Mở nhập điểm
            </Link>
            <Link
              href={`/students/${student.studentCode}`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại hồ sơ
            </Link>
          </>
        }
      />
      <StudentDataState source={source} error={error} />
      <StudentTranscriptView student={student} />
    </div>
  );
}
