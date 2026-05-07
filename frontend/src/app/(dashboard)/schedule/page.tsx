"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useAuthSession } from "@/hooks";
import { useTeachingListData } from "@/features/teaching/teaching-client-data";
import { teachingApi, type TimetableVersionApiRecord } from "@/features/teaching/api";
import { formatSchedule } from "@/features/teaching/utils/schedule-formatter";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export default function SchedulePage() {
  const { session } = useAuthSession();
  const isAdmin = session?.user.role === "ADMIN";
  const isTeacher = session?.user.role === "TEACHER";
  const { records, isLoading, error } = useTeachingListData(isTeacher ? "mine" : "all");
  const [yearFilter, setYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [selectedClassView, setSelectedClassView] = useState("all");
  const [versionAcademicYear, setVersionAcademicYear] = useState("");
  const [versionSemester, setVersionSemester] = useState("HK1");
  const [versionOptions, setVersionOptions] = useState<TimetableVersionApiRecord[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  const yearOptions = useMemo(
    () => Array.from(new Set(records.map((item) => item.academicYearCode))).filter(Boolean).sort((a, b) => b.localeCompare(a)),
    [records],
  );

  const semesterOptions = useMemo(
    () => Array.from(new Set(records.map((item) => item.semesterCode))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [records],
  );

  useEffect(() => {
    if (isTeacher) {
      return;
    }

    if (!versionAcademicYear) {
      const currentYear = new Date().getFullYear();
      const defaultYear = yearOptions[0] ?? `${currentYear}-${currentYear + 1}`;
      setVersionAcademicYear(defaultYear);
    }
  }, [isTeacher, versionAcademicYear, yearOptions]);

  useEffect(() => {
    if (isTeacher || !versionAcademicYear || !versionSemester) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setIsLoadingVersions(true);
        const response = await teachingApi.listTimetableVersions(versionSemester, versionAcademicYear);
        const rows = Array.isArray(response.data) ? response.data : [];

        if (cancelled) {
          return;
        }

        setVersionOptions(rows);
        setSelectedVersionId((current) => {
          if (current && rows.some((item) => item.versionId === current)) {
            return current;
          }

          return rows[0]?.versionId ?? "";
        });
      } catch {
        if (!cancelled) {
          setVersionOptions([]);
          setSelectedVersionId("");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingVersions(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isTeacher, versionAcademicYear, versionSemester]);

  const selectedVersionMeta = useMemo(
    () => versionOptions.find((item) => item.versionId === selectedVersionId),
    [versionOptions, selectedVersionId],
  );

  const selectedVersionStatus = (selectedVersionMeta?.status ?? "").toUpperCase();
  const isSelectedVersionReadOnly = selectedVersionStatus === "LOCKED" || selectedVersionStatus === "EXPIRED";
  const selectedVersionCreateHref = selectedVersionId
    ? `/schedule/new?sourceVersionId=${encodeURIComponent(selectedVersionId)}&academicYear=${encodeURIComponent(versionAcademicYear)}&semester=${encodeURIComponent(versionSemester)}`
    : `/schedule/new?academicYear=${encodeURIComponent(versionAcademicYear)}&semester=${encodeURIComponent(versionSemester)}`;
  const selectedVersionDetailHref = selectedVersionId
    ? `/schedule/${encodeURIComponent(selectedVersionId)}`
    : selectedVersionCreateHref;

  const groupedTimetables = useMemo(() => {
    const map = new Map<
      string,
      {
        academicYear: string;
        semester: string;
        totalAssignments: number;
        assignmentsWithSchedule: number;
        totalSlots: number;
        uniqueClasses: Set<string>;
      }
    >();

    records.forEach((item) => {
      const key = `${item.academicYearCode}__${item.semesterCode}`;
      const existing = map.get(key) ?? {
        academicYear: item.academicYearCode,
        semester: item.semesterCode,
        totalAssignments: 0,
        assignmentsWithSchedule: 0,
        totalSlots: 0,
        uniqueClasses: new Set<string>(),
      };

      existing.totalAssignments += 1;
      existing.uniqueClasses.add(item.classCode);

      const slots = item.scheduleData ?? [];
      if (slots.length > 0) {
        existing.assignmentsWithSchedule += 1;
        existing.totalSlots += slots.length;
      }

      map.set(key, existing);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        classesCount: item.uniqueClasses.size,
        completionRate:
          item.totalAssignments === 0 ? 0 : Math.round((item.assignmentsWithSchedule / item.totalAssignments) * 100),
      }))
      .sort((a, b) => {
        const yearComp = b.academicYear.localeCompare(a.academicYear);
        if (yearComp !== 0) {
          return yearComp;
        }
        return a.semester.localeCompare(b.semester);
      });
  }, [records]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return records
      .filter((item) => (yearFilter === "all" ? true : item.academicYearCode === yearFilter))
      .filter((item) => (semesterFilter === "all" ? true : item.semesterCode === semesterFilter))
      .filter((item) => {
        if (!normalizedKeyword) {
          return true;
        }
        const haystack = [
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
          .toLowerCase();
        return haystack.includes(normalizedKeyword);
      })
      .sort((a, b) => {
        const byYear = b.academicYearCode.localeCompare(a.academicYearCode);
        if (byYear !== 0) {
          return byYear;
        }

        const bySemester = a.semesterCode.localeCompare(b.semesterCode);
        if (bySemester !== 0) {
          return bySemester;
        }

        const byClass = a.classCode.localeCompare(b.classCode);
        if (byClass !== 0) {
          return byClass;
        }

        return a.subjectCode.localeCompare(b.subjectCode);
      });
  }, [records, keyword, yearFilter, semesterFilter]);

  const classOptions = useMemo(
    () => Array.from(new Set(filteredRows.map((item) => item.classCode))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [filteredRows],
  );

  const classFocusedSlots = useMemo(() => {
    const targetClass = selectedClassView === "all" ? classOptions[0] : selectedClassView;
    if (!targetClass) {
      return [] as Array<{
        day: string;
        period: string;
        subjectName: string;
        subjectCode: string;
        teacherName: string;
        teacherCode: string;
      }>;
    }

    return filteredRows
      .filter((item) => item.classCode === targetClass)
      .flatMap((item) =>
        (item.scheduleData ?? []).map((slot) => ({
          day: String(slot.day),
          period: String(slot.period),
          subjectName: item.subjectName,
          subjectCode: item.subjectCode,
          teacherName: item.teacherName,
          teacherCode: item.teacherCode,
        })),
      )
      .sort((a, b) => {
        const byDay = a.day.localeCompare(b.day);
        if (byDay !== 0) {
          return byDay;
        }
        return a.period.localeCompare(b.period);
      });
  }, [filteredRows, selectedClassView, classOptions]);

  function exportFilteredCsv() {
    const headers = [
      "academicYear",
      "semester",
      "classCode",
      "className",
      "subjectCode",
      "subjectName",
      "teacherCode",
      "teacherName",
      "status",
      "schedule",
    ];

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = filteredRows.map((item) => {
      const scheduleText = formatSchedule(item.scheduleData).replace(/\n/g, " | ");
      const status = (item.scheduleData ?? []).length > 0 ? "DA_CO_LICH" : "CHUA_CO_LICH";
      return [
        item.academicYearCode,
        item.semesterCode,
        item.classCode,
        item.className,
        item.subjectCode,
        item.subjectName,
        item.teacherCode,
        item.teacherName,
        status,
        scheduleText,
      ]
        .map((cell) => escapeCsv(String(cell ?? "")))
        .join(",");
    });

    const csvContent = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schedule_filtered_${yearFilter}_${semesterFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4 2xl:gap-5">
      <PageIntro
        eyebrow="Schedule"
        title={isTeacher ? "Thời khóa biểu giảng dạy của tôi" : "Quản lý thời khóa biểu và kiểm tra xung đột"}
        description={
          isTeacher
            ? "Xem lịch giảng dạy cá nhân theo năm học/học kỳ. Dữ liệu lấy theo tài khoản giáo viên hiện tại."
            : "Theo dõi nhanh trạng thái lập lịch theo từng năm học/học kỳ, sau đó vào màn hình lưới để xem hoặc chỉnh sửa."
        }
        actions={
          <>
            {isAdmin ? (
              <>
                <ButtonLink href="/schedule/new">
                  Lập thời khóa biểu
                </ButtonLink>
                <ButtonLink href="/teaching-assignments/assign-teachers" tone="secondary">
                  Phân công giáo viên
                </ButtonLink>
                <ButtonLink href="/classes" tone="secondary">
                  Quản lý lớp
                </ButtonLink>
                <ButtonLink href="/teachers" tone="secondary">
                  Quản lý giáo viên
                </ButtonLink>
              </>
            ) : (
              <ButtonLink href="/schedule" tone="secondary">
                Lịch của tôi
              </ButtonLink>
            )}
            <ButtonLink href="/schedule" tone="ghost">
              Làm mới màn hình
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu thời khóa biểu: {error}
        </Panel>
      ) : isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">Đang tải dữ liệu thời khóa biểu...</Panel>
      ) : (
        <>
          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Danh mục thời khóa biểu đã lập</h3>
                <p className="text-sm text-slate-500">Mỗi thẻ đại diện một kỳ lập lịch theo năm học và học kỳ.</p>
              </div>
            </div>

            {!isTeacher ? (
              <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Năm học</label>
                  <select
                    value={versionAcademicYear}
                    onChange={(event) => setVersionAcademicYear(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  >
                    {yearOptions.map((year) => (
                      <option key={`version-year-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Học kỳ</label>
                  <select
                    value={versionSemester}
                    onChange={(event) => setVersionSemester(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  >
                    <option value="HK1">HK1</option>
                    <option value="HK2">HK2</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Phiên bản thời khóa biểu (mặc định mới nhất)</label>
                  <select
                    value={selectedVersionId}
                    onChange={(event) => setSelectedVersionId(event.target.value)}
                    disabled={isLoadingVersions}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  >
                    <option value="">-- Chọn phiên bản --</option>
                    {versionOptions.map((item) => (
                      <option key={item.versionId} value={item.versionId}>
                        {(item.versionName ?? "Phiên bản") + ` (v${item.versionNo ?? 0} - ${(item.status ?? "").toUpperCase()})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3 text-xs text-slate-600">
                  {selectedVersionMeta ? (
                    <>
                      Hiệu lực: {selectedVersionMeta.effectiveFrom ?? "?"} đến {selectedVersionMeta.effectiveTo ?? "?"} •
                      Trạng thái: {selectedVersionStatus}{isSelectedVersionReadOnly ? " (chỉ xem)" : ""} •
                      Slot: {selectedVersionMeta.entryCount ?? 0}
                    </>
                  ) : (
                    "Chưa có phiên bản cho năm học/học kỳ đã chọn."
                  )}
                </div>

                <div className="md:col-span-1">
                  <div className="grid gap-2">
                    <ButtonLink
                      href={selectedVersionDetailHref}
                      className="w-full justify-center"
                      tone="secondary"
                    >
                      {selectedVersionId ? "Xem chi tiết" : "Mở thời khóa biểu"}
                    </ButtonLink>
                    {selectedVersionId ? (
                      <ButtonLink href={selectedVersionCreateHref} className="w-full justify-center">
                        Tạo bản mới từ phiên bản này
                      </ButtonLink>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {groupedTimetables.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu thời khóa biểu để hiển thị.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {groupedTimetables.map((item) => (
                  <div key={`${item.academicYear}-${item.semester}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.academicYear} • {item.semester}
                      </p>
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
                        Hoàn thành {item.completionRate}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <p>Phân công: {item.totalAssignments}</p>
                      <p>Lớp: {item.classesCount}</p>
                      <p>Có lịch: {item.assignmentsWithSchedule}</p>
                      <p>Tổng slot: {item.totalSlots}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ButtonLink
                        href={`/schedule/new?academicYear=${encodeURIComponent(item.academicYear)}&semester=${encodeURIComponent(item.semester)}`}
                        className="px-3 py-2 text-xs"
                        tone="secondary"
                      >
                        Mở lưới
                      </ButtonLink>
                      {isAdmin ? (
                        <ButtonLink
                          href={`/schedule/new?academicYear=${encodeURIComponent(item.academicYear)}&semester=${encodeURIComponent(item.semester)}`}
                          className="px-3 py-2 text-xs"
                        >
                          Tạo bản mới
                        </ButtonLink>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="p-5 md:p-6">
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <label htmlFor="schedule-keyword" className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Tìm kiếm
                </label>
                <input
                  id="schedule-keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Giáo viên, lớp, môn học..."
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="schedule-year-filter" className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Năm học
                </label>
                <select
                  id="schedule-year-filter"
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
                <label htmlFor="schedule-semester-filter" className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Học kỳ
                </label>
                <select
                  id="schedule-semester-filter"
                  value={semesterFilter}
                  onChange={(event) => setSemesterFilter(event.target.value)}
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
            </div>

            <div className="mb-3 flex items-center justify-between text-sm">
              <p className="text-slate-700">
                Hiển thị <span className="font-semibold">{filteredRows.length}</span> phân công phù hợp bộ lọc.
              </p>
              <button
                type="button"
                onClick={exportFilteredCsv}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Năm học / HK</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Giáo viên</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Lớp - Môn</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Trạng thái</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Lịch dạy</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.map((item) => (
                    <tr key={item.assignmentId}>
                      <td className="px-3 py-2 text-slate-600">
                        <p className="font-medium text-slate-900">{item.academicYearCode}</p>
                        <p>{item.semesterCode}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        <p className="font-medium text-slate-900">{item.teacherName}</p>
                        <p className="text-xs">{item.teacherCode}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        <p className="font-medium text-slate-900">{item.className}</p>
                        <p className="text-xs">{item.subjectName}</p>
                      </td>
                      <td className="px-3 py-2">
                        {(item.scheduleData ?? []).length > 0 ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            Đã có lịch
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Chưa có lịch
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        <div className="max-w-[360px] whitespace-pre-wrap">{formatSchedule(item.scheduleData)}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/teaching-assignments/${item.assignmentId}/detail`}
                            className="inline-flex items-center rounded-full border border-sky-300 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                          >
                            Xem
                          </Link>
                          {isAdmin ? (
                            <Link
                              href={`/teaching-assignments/${item.assignmentId}/edit`}
                              className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Sửa
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Xem nhanh thời khóa biểu theo lớp</h3>
                <p className="text-sm text-slate-500">Giúp kiểm tra nhanh các tiết đã gán của một lớp trong tập dữ liệu đang lọc.</p>
              </div>
              <div className="min-w-[220px]">
                <label htmlFor="class-focused-view" className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Chọn lớp
                </label>
                <select
                  id="class-focused-view"
                  value={selectedClassView}
                  onChange={(event) => setSelectedClassView(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                >
                  <option value="all">Tự động lớp đầu tiên</option>
                  {classOptions.map((classCode) => (
                    <option key={classCode} value={classCode}>
                      {classCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {classFocusedSlots.length === 0 ? (
              <p className="text-sm text-slate-500">Không có slot nào cho lớp được chọn trong bộ lọc hiện tại.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Thứ</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Tiết</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Môn học</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Giáo viên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {classFocusedSlots.map((slot, index) => (
                      <tr key={`${slot.day}-${slot.period}-${slot.subjectCode}-${index}`}>
                        <td className="px-3 py-2">{slot.day}</td>
                        <td className="px-3 py-2">{slot.period}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">{slot.subjectName}</p>
                          <p className="text-xs text-slate-500">{slot.subjectCode}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">{slot.teacherName}</p>
                          <p className="text-xs text-slate-500">{slot.teacherCode}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
