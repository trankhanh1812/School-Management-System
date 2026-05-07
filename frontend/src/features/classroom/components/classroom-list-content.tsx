"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ClassroomSummaryCard } from "@/features/classroom/components/classroom-summary-card";
import { useClassroomListData } from "@/features/classroom/classroom-client-data";
import { useDebounce } from "@/hooks/use-debounce";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export function ClassroomListContent() {
  const [scope, setScope] = useState<"current" | "all">("current");
  const [academicYearCode, setAcademicYearCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);

  const filters = useMemo(
    () => ({
      scope,
      academicYearCode: academicYearCode.trim() || undefined,
      search: debouncedSearch.trim() || undefined,
      limit: 100,
    }),
    [scope, academicYearCode, debouncedSearch],
  );

  const { records, isLoading, error } = useClassroomListData(filters);

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Classes"
        title="Quản lý lớp học theo năm học"
        description="Mặc định chỉ hiển thị lớp của năm học hiện tại để thao tác nhanh; dùng bộ lọc để xem lịch sử."
        actions={
          <>
            <ButtonLink href="/classes/new" tone="secondary">
              Tạo lớp học
            </ButtonLink>
            <ButtonLink href="/schedule" tone="secondary">
              Mở thời khóa biểu
            </ButtonLink>
            <ButtonLink href="/classes/promotion">Xét lên lớp</ButtonLink>
          </>
        }
      />

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu lớp học: {error}
        </Panel>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Bộ lọc lớp học</h3>
          <p className="mt-2 text-sm text-slate-600">Không cần cuộn toàn bộ dữ liệu lớp nhiều năm để tìm lớp cần thao tác.</p>

          <div className="mt-4 grid gap-3">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo mã lớp, tên lớp, GVCN..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value as "current" | "all")}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              >
                <option value="current">Năm học hiện tại</option>
                <option value="all">Tất cả năm học</option>
              </select>
              <input
                value={academicYearCode}
                onChange={(event) => setAcademicYearCode(event.target.value)}
                placeholder="Mã năm học (vd: 2026-2027)"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <ButtonLink href="/classes/promotion" tone="secondary" className="mt-5">
            Mở trung tâm xét lớp
          </ButtonLink>
        </Panel>

        <div className="grid gap-4">
          {isLoading && (
            <Panel className="p-4 text-sm text-slate-500">Đang tải danh sách lớp...</Panel>
          )}
          {!isLoading && records.length === 0 && (
            <Panel className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Chưa có dữ liệu lớp học.
            </Panel>
          )}
          {records.map((classroom) => (
            <ClassroomSummaryCard key={classroom.classCode} classroom={classroom} />
          ))}
        </div>
      </section>
    </div>
  );
}
