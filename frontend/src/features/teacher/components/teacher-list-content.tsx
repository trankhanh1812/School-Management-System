"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { TeacherSummaryCard } from "@/features/teacher/components/teacher-summary-card";
import { useTeacherListData } from "@/features/teacher/teacher-client-data";
import { useDebounce } from "@/hooks/use-debounce";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export function TeacherListContent() {
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);

  const filters = useMemo(
    () => ({
      departmentQuery: departmentQuery.trim() || undefined,
      search: debouncedSearch.trim() || undefined,
      limit: 100,
    }),
    [departmentQuery, debouncedSearch],
  );

  const { records, departments, isLoading, error, refresh } =
    useTeacherListData(filters);

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Teachers"
        title="Quản lý giáo viên, bộ môn và phân công giảng dạy"
        description="Mặc định hiển thị danh sách gọn, lọc theo bộ môn hoặc tìm kiếm để tránh cuộn quá nhiều dữ liệu."
        actions={
          <>
            <ButtonLink href="/teachers/new" tone="secondary">
              Thêm giáo viên
            </ButtonLink>
            <ButtonLink href="/subjects" tone="secondary">
              Xem môn học
            </ButtonLink>
            <ButtonLink href="/scores">Mở quản lý điểm</ButtonLink>
          </>
        }
      />

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu giáo viên: {error}
        </Panel>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            Bộ môn đang quản lý
          </h3>
          <div className="mt-4 grid gap-3">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo mã GV, họ tên, bộ môn..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
            />
            <select
              value={departmentQuery}
              onChange={(event) => setDepartmentQuery(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
            >
              <option value="">Tất cả bộ môn</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-3">
            {departments.map((department) => (
              <div
                key={department.id}
                className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700"
              >
                <p className="font-semibold text-slate-950">
                  {department.name}
                </p>
                <p className="mt-1">Trưởng bộ môn: {department.headTeacher}</p>
                <p className="mt-1">Phó bộ môn: {department.viceHeadTeacher}</p>
                <p className="mt-1">
                  {department.teacherCount} giáo viên •{" "}
                  {department.subjectCount} môn phụ trách
                </p>
              </div>
            ))}
            {!isLoading && departments.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Chưa có dữ liệu bộ môn.
              </div>
            )}
          </div>
        </Panel>

        <div className="grid gap-4">
          {isLoading && (
            <Panel className="p-4 text-sm text-slate-500">
              Đang tải danh sách giáo viên...
            </Panel>
          )}
          {!isLoading && records.length === 0 && (
            <Panel className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Chưa có dữ liệu giáo viên.
            </Panel>
          )}
          {records.map((teacher) => (
            <TeacherSummaryCard
              key={teacher.teacherCode}
              teacher={teacher}
              onDeleted={() => void refresh()}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
