"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/features/dashboard/components/data-table";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { teachingApi } from "@/features/teaching/api";
import { useTeachingListData } from "@/features/teaching/teaching-client-data";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useToast } from "@/shared/components/toast-provider";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { formatSchedule } from "@/features/teaching/utils/schedule-formatter";
import { TeachingMyAssignmentsContent } from "@/features/teaching/components/teaching-my-assignments-content";

export function TeachingListContent() {
  const searchParams = useSearchParams();
  const { records, isLoading, error, refresh } = useTeachingListData();
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState(searchParams.get("q")?.trim() ?? "");
  const [yearFilter, setYearFilter] = useState(
    searchParams.get("academicYear")?.trim() || "all",
  );
  const [semesterFilter, setSemesterFilter] = useState(
    searchParams.get("semester")?.trim().toUpperCase() || "all",
  );
  const [subjectFilter, setSubjectFilter] = useState(
    searchParams.get("subject")?.trim().toUpperCase() || "all",
  );
  const isAdmin = session?.user.role === "ADMIN";
  const isTeacher = session?.user.role === "TEACHER";
  const isDepartmentManager =
    isTeacher &&
    (session?.user.departmentLevel === 1 ||
      session?.user.departmentLevel === 2);

  const yearOptions = useMemo(
    () =>
      Array.from(new Set(records.map((item) => item.academicYearCode)))
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a)),
    [records],
  );

  const semesterOptions = useMemo(
    () =>
      Array.from(new Set(records.map((item) => item.semesterCode)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [records],
  );

  const subjectOptions = useMemo(
    () =>
      Array.from(new Set(records.map((item) => item.subjectCode)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [records],
  );

  const editBatchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (yearFilter !== "all") {
      params.set("academicYear", yearFilter);
    }
    if (semesterFilter !== "all") {
      params.set("semester", semesterFilter);
    }
    if (subjectFilter !== "all") {
      params.set("subject", subjectFilter);
    }
    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }
    const query = params.toString();
    return query
      ? `/teaching-assignments/assign-teachers?${query}`
      : "/teaching-assignments/assign-teachers";
  }, [yearFilter, semesterFilter, subjectFilter, keyword]);

  const filteredRecords = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return records
      .filter((item) =>
        yearFilter === "all" ? true : item.academicYearCode === yearFilter,
      )
      .filter((item) =>
        semesterFilter === "all" ? true : item.semesterCode === semesterFilter,
      )
      .filter((item) =>
        subjectFilter === "all" ? true : item.subjectCode === subjectFilter,
      )
      .filter((item) => {
        if (!q) {
          return true;
        }
        return [
          item.teacherName,
          item.teacherCode,
          item.className,
          item.classCode,
          item.subjectName,
          item.subjectCode,
          item.academicYearCode,
          item.semesterCode,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => a.classCode.localeCompare(b.classCode));
  }, [records, keyword, yearFilter, semesterFilter, subjectFilter]);

  if (isTeacher && !isDepartmentManager) {
    return <TeachingMyAssignmentsContent />;
  }

  async function handleDelete(assignmentId: string) {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa phân công giảng dạy này?",
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(assignmentId);
    try {
      await teachingApi.delete(assignmentId);
      await refresh();
      showToast("Đã xóa phân công giảng dạy.", "success");
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa phân công giảng dạy.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Teaching"
        title={
          isDepartmentManager
            ? "Phân công giảng dạy bộ môn"
            : isTeacher
              ? "Phân công giảng dạy của tôi"
              : "Quản lý phân công giảng dạy"
        }
        description={
          isDepartmentManager
            ? "Xem và điều phối phân công giáo viên trong phạm vi bộ môn của bạn."
            : isTeacher
              ? "Bạn chỉ xem được các phân công thuộc tài khoản giáo viên hiện tại."
              : "Quản lý phân công giáo viên - lớp - môn theo học kỳ và năm học."
        }
        actions={
          <>
            {isAdmin || isDepartmentManager ? (
              <>
                <ButtonLink href={editBatchHref} tone="primary">
                  Chỉnh sửa đợt này
                </ButtonLink>
                <ButtonLink
                  href="/teaching-assignments/assign-teachers"
                  tone="secondary"
                >
                  Phân công giáo viên
                </ButtonLink>
                {isAdmin && (
                  <ButtonLink href="/subjects" tone="secondary">
                    Về môn học
                  </ButtonLink>
                )}
              </>
            ) : null}
          </>
        }
      />

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu phân công: {error}
        </Panel>
      )}

      {isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">
          Đang tải phân công giảng dạy...
        </Panel>
      ) : (
        (() => {
          const columns = isAdmin
            ? [
                "Giáo viên",
                "Lớp",
                "Môn",
                "Lịch dạy",
                "Học kỳ",
                "Năm học",
                "Hành động",
              ]
            : ["Giáo viên", "Lớp", "Môn", "Lịch dạy", "Học kỳ", "Năm học"];

          const rows = filteredRecords.map((item) => {
            const scheduleText = formatSchedule(item.scheduleData);

            const baseRow = [
              `${item.teacherName} (${item.teacherCode})`,
              `${item.className} (${item.classCode})`,
              `${item.subjectName} (${item.subjectCode})`,
              <div
                key={`schedule-${item.assignmentId}`}
                className="whitespace-pre-wrap text-xs text-slate-600"
              >
                {scheduleText}
              </div>,
              item.semesterCode,
              item.academicYearCode,
            ];

            if (!isAdmin) {
              return baseRow;
            }

            return [
              ...baseRow,
              <div key={`actions-${item.assignmentId}`} className="flex gap-2">
                <Link
                  href={`/teaching-assignments/${item.assignmentId}/detail`}
                  className="inline-flex items-center justify-center rounded-full border border-sky-300 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                >
                  Chi tiết
                </Link>
                <Link
                  href={`/teaching-assignments/${item.assignmentId}/edit`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Sửa
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.assignmentId)}
                  disabled={deletingId === item.assignmentId}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === item.assignmentId ? "Đang xóa..." : "Xóa"}
                </button>
              </div>,
            ];
          });

          return (
            <div className="grid gap-4">
              <Panel className="p-5 sm:p-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Tìm kiếm
                    </label>
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="Giáo viên, lớp, môn..."
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Năm học
                    </label>
                    <select
                      value={yearFilter}
                      onChange={(event) => setYearFilter(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                    >
                      <option value="all">Tất cả</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Học kỳ
                    </label>
                    <select
                      value={semesterFilter}
                      onChange={(event) =>
                        setSemesterFilter(event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                    >
                      <option value="all">Tất cả</option>
                      {semesterOptions.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Môn học
                    </label>
                    <select
                      value={subjectFilter}
                      onChange={(event) => setSubjectFilter(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                    >
                      <option value="all">Tất cả</option>
                      {subjectOptions.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 flex items-end">
                    <p className="text-sm text-slate-700">
                      Hiển thị {filteredRecords.length} bản ghi phù hợp.
                    </p>
                  </div>
                </div>
              </Panel>

              <DataTable
                title={
                  isAdmin
                    ? "Danh sách phân công giảng dạy"
                    : "Phân công giảng dạy"
                }
                description={
                  isAdmin
                    ? "Tổng hợp toàn bộ phân công theo giáo viên, lớp, môn, học kỳ và năm học."
                    : "Danh sách phân công theo quyền hiện tại."
                }
                columns={columns}
                rows={rows}
              />
            </div>
          );
        })()
      )}
    </div>
  );
}
