"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { DataTable } from "@/features/dashboard/components/data-table";
import { conductApi } from "@/features/conduct/api";
import { useConductListData } from "@/features/conduct/conduct-client-data";
import { useToast } from "@/shared/components/toast-provider";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export function ConductListContent() {
  const { records, isLoading, error, refresh } = useConductListData();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("");

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedSemester = semesterFilter.trim().toLowerCase();

    return records.filter((item) => {
      if (levelFilter !== "ALL" && (item.conductLevel || "") !== levelFilter) {
        return false;
      }

      if (normalizedSemester && !(item.semesterCode || "").toLowerCase().includes(normalizedSemester)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchTarget = [
        item.studentName,
        item.studentCode,
        item.className,
        item.classCode,
        item.assessedByName,
        item.assessedByTeacherCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(normalizedSearch);
    });
  }, [records, search, levelFilter, semesterFilter]);

  const summary = useMemo(() => {
    let excellent = 0;
    let good = 0;
    let average = 0;
    let weak = 0;

    filteredRecords.forEach((item) => {
      switch (item.conductLevel || "") {
        case "Tốt":
          excellent += 1;
          break;
        case "Khá":
          good += 1;
          break;
        case "Trung bình":
          average += 1;
          break;
        case "Yếu":
          weak += 1;
          break;
        default:
          break;
      }
    });

    return {
      total: filteredRecords.length,
      excellent,
      good,
      average,
      weak,
    };
  }, [filteredRecords]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa bản ghi hạnh kiểm này?");
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      await conductApi.delete(id);
      await refresh();
      showToast("Đã xóa bản ghi hạnh kiểm.", "success");
    } catch (deleteError) {
      showToast(deleteError instanceof Error ? deleteError.message : "Không thể xóa bản ghi hạnh kiểm.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Students / Conduct"
        title="Hạnh kiểm theo học kỳ"
        description="Quản lý hạnh kiểm nằm trong luồng Học sinh để đồng bộ với hồ sơ, điểm số và học bạ."
        actions={
          <>
            <ButtonLink href="/students" tone="secondary">
              Về module Học sinh
            </ButtonLink>
            <ButtonLink href="/students/conduct/new">Thêm hạnh kiểm</ButtonLink>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Panel className="border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Tổng bản ghi</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.total}</p>
        </Panel>
        <Panel className="border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Tốt</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">{summary.excellent}</p>
        </Panel>
        <Panel className="border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-700">Khá</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-900">{summary.good}</p>
        </Panel>
        <Panel className="border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Trung bình</p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">{summary.average}</p>
        </Panel>
        <Panel className="border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-rose-700">Yếu</p>
          <p className="mt-2 text-2xl font-semibold text-rose-900">{summary.weak}</p>
        </Panel>
      </section>

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo học sinh, lớp, giáo viên..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
          />
          <input
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
            placeholder="Lọc theo mã học kỳ (vd: HK1)"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
          />
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
          >
            <option value="ALL">Tất cả mức hạnh kiểm</option>
            <option value="Tốt">Tốt</option>
            <option value="Khá">Khá</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Yếu">Yếu</option>
          </select>
        </div>
      </Panel>

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu hạnh kiểm: {error}
        </Panel>
      )}

      {isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">Đang tải danh sách hạnh kiểm...</Panel>
      ) : (
        <DataTable
          title="Danh sách hạnh kiểm"
          description="Mỗi bản ghi liên kết học sinh, học kỳ, lớp và giáo viên đánh giá."
          columns={[
            "Học sinh",
            "Mã học kỳ",
            "Mã lớp",
            "Hạnh kiểm",
            "Giáo viên",
            "Ghi chú",
            "Hành động",
          ]}
          rows={filteredRecords.map((item) => [
            `${item.studentName || "Chưa cập nhật"} (${item.studentCode || "N/A"})`,
            `${item.semesterCode || "N/A"} (${item.academicYearCode || "N/A"})`,
            `${item.className || "Chưa cập nhật"} (${item.classCode || "N/A"})`,
            item.conductLevel || "Chưa cập nhật",
            `${item.assessedByName || "Chưa cập nhật"} (${item.assessedByTeacherCode || "N/A"})`,
            item.remarks || "",
            <div key={`actions-${item.id}`} className="flex items-center gap-2">
              <Link
                href={`/students/conduct/${item.id}/edit`}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sửa
              </Link>
              <button
                type="button"
                onClick={() => item.id && void handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === item.id ? "Đang xóa..." : "Xóa"}
              </button>
            </div>,
          ])}
        />
      )}
    </div>
  );
}
