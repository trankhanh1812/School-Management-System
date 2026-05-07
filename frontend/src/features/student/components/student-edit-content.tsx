"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { StudentForm } from "@/features/student/components/student-form";
import { useStudentDetailData } from "@/features/student/student-client-data";
import { EmptyState } from "@/shared/components/empty-state";

export function StudentEditContent({ studentCode }: { studentCode: string }) {
  const { student, source, isLoading, error } = useStudentDetailData(studentCode);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải hồ sơ để chỉnh sửa...</div>;
  }

  if (!student) {
    return (
      <EmptyState
        title="Không tìm thấy hồ sơ để chỉnh sửa"
        description="Không tìm thấy hồ sơ cần chỉnh sửa. Vui lòng kiểm tra lại mã học sinh."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Students / Edit"
        title={`Chỉnh sửa hồ sơ • ${student.fullName}`}
        description="Màn hình này là nền cho cập nhật thông tin cá nhân, trạng thái học tập, chuyển lớp và đồng bộ phụ huynh mà không làm mất lịch sử student-class."
        actions={
          <>
            <Link
              href={`/students/${student.studentCode}`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Xem hồ sơ
            </Link>
            <Link
              href="/students"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>
          </>
        }
      />
      <StudentDataState source={source} error={error} />
      <StudentForm mode="edit" student={student} />
    </div>
  );
}
