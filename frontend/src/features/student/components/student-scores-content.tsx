"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { StudentScoreManager } from "@/features/student/components/student-score-manager";
import { useStudentDetailData } from "@/features/student/student-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export function StudentScoresContent({ studentCode }: { studentCode: string }) {
  const { student, source, isLoading, error } = useStudentDetailData(studentCode);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải dữ liệu điểm...</div>;
  }

  if (!student) {
    return (
      <EmptyState
        title="Không tìm thấy dữ liệu điểm"
        description="Chưa có dữ liệu học sinh tương ứng để hiển thị màn hình nhập điểm."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Students / Scores"
        title={`Nhập và cập nhật điểm • ${student.fullName}`}
        description="Màn hình này đi sâu vào đầu điểm chi tiết theo môn, kỳ và loại đánh giá. Đây là nền để nối teaching assignment, score history và khóa nhập điểm sau deadline."
        actions={
          <>
            <Link
              href={`/students/${student.studentCode}/transcript`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Xem học bạ
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

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2 text-sm text-slate-700">
            <p>Mã học sinh: {student.studentCode}</p>
            <p>Lớp hiện tại: {student.className}</p>
            <p>Năm học: {student.academicYear}</p>
            <p>GVCN: {student.homeroomTeacher}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button tone="secondary" className="h-11 px-5">
              Lưu tạm điểm
            </Button>
            <Button className="h-11 px-5">Gửi duyệt điểm</Button>
          </div>
        </div>
      </Panel>
      <StudentScoreManager student={student} />
    </div>
  );
}
