"use client";

import Link from "next/link";
import { useState } from "react";
import { DataTable } from "@/features/dashboard/components/data-table";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { subjectApi } from "@/features/subject/api";
import { useSubjectListData } from "@/features/subject/subject-client-data";
import { useToast } from "@/shared/components/toast-provider";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export function SubjectListContent() {
  const { records, isLoading, error, refresh } = useSubjectListData();
  const { showToast } = useToast();
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  async function handleDelete(subjectCode: string) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa môn ${subjectCode}?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingCode(subjectCode);
    try {
      await subjectApi.delete(subjectCode);
      await refresh();
      showToast(`Đã xóa môn ${subjectCode}.`, "success");
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa môn học.",
        "error",
      );
    } finally {
      setDeletingCode(null);
    }
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Subjects"
        title="Quản lý môn học và phân công giảng dạy"
        description="Đồng bộ dữ liệu môn học và phân công giảng dạy từ backend theo chuẩn nghiệp vụ."
        actions={
          <>
            <ButtonLink href="/subjects/new" tone="secondary">
              Tạo môn học
            </ButtonLink>
            <ButtonLink href="/teaching-assignments" tone="secondary">
              Xem phân công
            </ButtonLink>
          </>
        }
      />

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu môn học: {error}
        </Panel>
      )}

      {isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">
          Đang tải danh sách môn học...
        </Panel>
      ) : (
        <DataTable
          title="Danh sách môn học"
          description="Mỗi môn học liên kết trực tiếp với bộ môn và phân công giảng dạy tương ứng."
          columns={[
            "Mã môn",
            "Tên môn",
            "Bộ môn",
            "Khối",
            "Trạng thái",
            "Số phân công",
            "Hành động",
          ]}
          rows={records.map((subject) => [
            subject.code,
            subject.name,
            `${subject.departmentName} (${subject.departmentCode || "N/A"})`,
            subject.gradeLevel ? `Khối ${subject.gradeLevel}` : "Chưa cập nhật",
            subject.status,
            String(subject.assignmentCount),
            <div
              key={`actions-${subject.code}`}
              className="flex items-center gap-2"
            >
              <Link
                href={`/subjects/${subject.code}/edit`}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sửa
              </Link>
              <button
                type="button"
                onClick={() => void handleDelete(subject.code)}
                disabled={deletingCode === subject.code}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingCode === subject.code ? "Đang xóa..." : "Xóa"}
              </button>
            </div>,
          ])}
        />
      )}
    </div>
  );
}
