"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/shared/ui/panel";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/components/toast-provider";
import { classroomApi } from "@/features/classroom/api";
import { subjectApi } from "@/features/subject/api";
import { teachingApi, type TimetableImportPreviewResponse } from "@/features/teaching/api";
import { ImportPreviewModal } from "@/shared/components/import-preview-modal";

type GradeLevel = "all" | "10" | "11" | "12";
type Shift = "MORNING" | "AFTERNOON";

type SubjectOption = {
  code: string;
  name: string;
};

type YearOption = {
  code: string;
  name: string;
};

type TimetableVersionOption = {
  versionId: string;
  versionName: string;
  versionNo: number;
  status: "DRAFT" | "LOCKED" | "EXPIRED";
  active: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  entryCount: number;
};

type TeachingCreateGridContentProps = {
  mode?: "edit" | "view";
  initialVersionId?: string;
};

const DAYS_OF_WEEK = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
];

const PERIODS_BY_SHIFT: Record<Shift, number[]> = {
  MORNING: [1, 2, 3, 4, 5],
  AFTERNOON: [6, 7, 8, 9, 10],
};

function toYearCode(raw?: string) {
  if (!raw) {
    return "";
  }
  const text = raw.trim();
  const match = text.match(/(\d{4})\s*[-/]\s*(\d{4})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return text.toUpperCase();
}

function parseGrade(classCode?: string, grade?: string): "10" | "11" | "12" | null {
  const byGrade = (grade ?? "").match(/10|11|12/);
  if (byGrade) {
    return byGrade[0] as "10" | "11" | "12";
  }

  const byCode = (classCode ?? "").trim().match(/^(10|11|12)/);
  if (byCode) {
    return byCode[1] as "10" | "11" | "12";
  }

  return null;
}

function toIsoDate(raw?: string) {
  if (!raw) {
    return "";
  }

  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function rangesOverlap(leftFrom: string, leftTo: string, rightFrom: string, rightTo: string) {
  if (!leftFrom || !leftTo || !rightFrom || !rightTo) {
    return false;
  }

  return leftFrom <= rightTo && rightFrom <= leftTo;
}

export function TeachingCreateGridContent({ mode = "edit", initialVersionId = "" }: TeachingCreateGridContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [yearOptions, setYearOptions] = useState<YearOption[]>([]);
  const [classesByGrade, setClassesByGrade] = useState<Record<"10" | "11" | "12", string[]>>({
    "10": [],
    "11": [],
    "12": [],
  });
  const [timetableVersions, setTimetableVersions] = useState<TimetableVersionOption[]>([]);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [versionName, setVersionName] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [selectedShift, setSelectedShift] = useState<Shift>("MORNING");
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>("all");
  const [cellData, setCellData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewingImport, setIsPreviewingImport] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<TimetableImportPreviewResponse | null>(null);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const prefilledAcademicYear = searchParams.get("academicYear")?.trim() ?? "";
  const prefilledSemester = searchParams.get("semester")?.trim().toUpperCase() ?? "";
  const prefilledVersionId = initialVersionId.trim() || (searchParams.get("sourceVersionId")?.trim() ?? searchParams.get("versionId")?.trim() ?? "");

  const periods = useMemo(() => PERIODS_BY_SHIFT[selectedShift], [selectedShift]);

  const classesForDisplay = useMemo<Record<string, string[]>>(() => {
    if (selectedGrade === "all") {
      return {
        "10": classesByGrade["10"],
        "11": classesByGrade["11"],
        "12": classesByGrade["12"],
      };
    }

    return {
      [selectedGrade]: classesByGrade[selectedGrade as "10" | "11" | "12"],
    };
  }, [classesByGrade, selectedGrade]);

  const hasInvalidDateRange = useMemo(() => {
    if (!effectiveFrom || !effectiveTo) {
      return false;
    }

    return effectiveFrom > effectiveTo;
  }, [effectiveFrom, effectiveTo]);

  const hasLockedOverlap = useMemo(() => {
    if (!effectiveFrom || !effectiveTo || hasInvalidDateRange) {
      return false;
    }

    return timetableVersions.some((item) => item.status === "LOCKED" && rangesOverlap(effectiveFrom, effectiveTo, item.effectiveFrom, item.effectiveTo));
  }, [effectiveFrom, effectiveTo, hasInvalidDateRange, timetableVersions]);

  const selectedVersionMeta = useMemo(
    () => timetableVersions.find((item) => item.versionId === selectedVersionId),
    [timetableVersions, selectedVersionId],
  );

  const isViewMode = mode === "view";
  const isReadOnlyVersion = isViewMode;
  const sourceVersionLabel = !isViewMode && selectedVersionMeta ? `Đang sao chép từ phiên bản ${selectedVersionMeta.versionName} (${selectedVersionMeta.status})` : "Tạo một phiên bản mới từ dữ liệu hiện tại hoặc từ phiên bản nguồn đã chọn.";

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const [subjectsRes, classesRes] = await Promise.all([
          subjectApi.list(),
          classroomApi.list({ scope: "all" }),
        ]);

        const subjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
        const classes = Array.isArray(classesRes.data) ? classesRes.data : [];

        setSubjectOptions(
          subjects
            .filter((item) => (item.code ?? "").trim().length > 0)
            .map((item) => ({
              code: (item.code ?? "").trim().toUpperCase(),
              name: (item.name ?? item.code ?? "").trim(),
            })),
        );

        const nextClasses: Record<"10" | "11" | "12", string[]> = { "10": [], "11": [], "12": [] };
        const yearSet = new Set<string>();

        classes.forEach((item) => {
          const classCode = (item.classCode ?? "").trim().toUpperCase();
          if (!classCode) {
            return;
          }

          const grade = parseGrade(classCode, item.grade);
          if (grade && !nextClasses[grade].includes(classCode)) {
            nextClasses[grade].push(classCode);
          }

          const yearCode = toYearCode(item.academicYear);
          if (yearCode) {
            yearSet.add(yearCode);
          }
        });

        const currentYear = new Date().getFullYear();
        const currentYearCode = `${currentYear}-${currentYear + 1}`;
        yearSet.add(currentYearCode);

        const years = Array.from(yearSet)
          .sort((a, b) => b.localeCompare(a))
          .map((code) => ({
            code,
            name: `Năm học ${code}`,
          }));

        setClassesByGrade(nextClasses);
        setYearOptions(years);

        const preferredYear =
          years.find((item) => item.code === prefilledAcademicYear)?.code ??
          years.find((item) => item.code === currentYearCode)?.code ??
          years[0]?.code ??
          "";
        setSelectedAcademicYear(preferredYear);

        if (prefilledSemester === "HK1" || prefilledSemester === "HK2") {
          setSelectedSemester(prefilledSemester);
        }
      } catch {
        showToast("Không thể tải dữ liệu tạo thời khóa biểu", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [showToast, prefilledAcademicYear, prefilledSemester]);

  useEffect(() => {
    if (!selectedAcademicYear || !selectedSemester) {
      setTimetableVersions([]);
      setSelectedVersionId("");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setIsLoadingVersions(true);
        const response = await teachingApi.listTimetableVersions(selectedSemester, selectedAcademicYear);
        const rows = Array.isArray(response.data) ? response.data : [];

        if (cancelled) {
          return;
        }

        const mapped = rows
          .map((item) => ({
            versionId: (item.versionId ?? "").trim(),
            versionName: (item.versionName ?? "").trim() || `Phiên bản ${item.versionNo ?? 0}`,
            versionNo: Number(item.versionNo ?? 0),
            status: ((item.status ?? "LOCKED").toUpperCase() === "DRAFT" ? "DRAFT" : "LOCKED") as "DRAFT" | "LOCKED",
            active: Boolean(item.active),
            effectiveFrom: toIsoDate(item.effectiveFrom),
            effectiveTo: toIsoDate(item.effectiveTo),
            entryCount: Number(item.entryCount ?? 0),
          }))
          .filter((item) => item.versionId.length > 0);

        setTimetableVersions(mapped);

        const preferredVersionId = prefilledVersionId && mapped.some((item) => item.versionId === prefilledVersionId)
          ? prefilledVersionId
          : mapped[0]?.versionId ?? "";

        setSelectedVersionId(preferredVersionId);

        if (preferredVersionId) {
          const selectedVersion = mapped.find((item) => item.versionId === preferredVersionId);
          if (selectedVersion) {
            setVersionName(selectedVersion.versionName);
            setEffectiveFrom(selectedVersion.effectiveFrom);
            setEffectiveTo(selectedVersion.effectiveTo);
          }
        } else {
          const today = new Date().toISOString().slice(0, 10);
          setVersionName(`TKB ${selectedSemester} ${selectedAcademicYear}`);
          setEffectiveFrom(today);
          setEffectiveTo(today);
        }
      } catch {
        if (!cancelled) {
          setTimetableVersions([]);
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
  }, [selectedAcademicYear, selectedSemester, prefilledVersionId]);

  useEffect(() => {
    if (!selectedAcademicYear || !selectedSemester) {
      return;
    }

    void (async () => {
      try {
        const response = await teachingApi.getTimetableGrid(selectedSemester, selectedAcademicYear, selectedVersionId || undefined);
        const rows = Array.isArray(response.data) ? response.data : [];

        const next: Record<string, string> = {};
        rows.forEach((item) => {
          const classCode = (item.classCode ?? "").trim().toUpperCase();
          const subjectCode = (item.subjectCode ?? "").trim().toUpperCase();
          const day = Number(item.dayOfWeek);
          const periodStart = Number(item.periodStart);
          const periodEnd = Number(item.periodEnd);

          if (!classCode || !subjectCode || !day || !periodStart || !periodEnd) {
            return;
          }

          for (let period = periodStart; period <= periodEnd; period += 1) {
            next[`${classCode}_${day}_${period}`] = subjectCode;
          }
        });

        setCellData(next);
      } catch {
        setCellData({});
      }
    })();
  }, [selectedAcademicYear, selectedSemester, selectedVersionId]);

  const handleSubjectChange = (classCode: string, day: number, period: number, subjectCode: string) => {
    const key = `${classCode}_${day}_${period}`;

    setCellData((prev) => {
      const next = { ...prev };
      const value = subjectCode.trim().toUpperCase();
      if (!value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleVersionSelectionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    const selectedVersion = timetableVersions.find((item) => item.versionId === versionId);
    if (!selectedVersion) {
      return;
    }

    setVersionName(selectedVersion.versionName);
    setEffectiveFrom(selectedVersion.effectiveFrom);
    setEffectiveTo(selectedVersion.effectiveTo);
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const blob = await teachingApi.downloadTimetableImportTemplate();
      saveBlob(blob, "TKB_Template_36lop.xlsx");
      showToast("Đã tải template import thời khóa biểu", "success");
    } catch {
      showToast("Không thể tải template import thời khóa biểu", "error");
    }
  };

  const handleSelectImportFile = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChanged = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsPreviewingImport(true);
    try {
      const response = await teachingApi.previewTimetableImport(file);
      const preview = response.data;
      setImportPreviewData(preview);
      setShowImportPreview(true);
      showToast("Đã tạo preview import thời khóa biểu", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể preview file import", "error");
    } finally {
      setIsPreviewingImport(false);
      event.currentTarget.value = "";
    }
  };

  const handleApplyImportedData = () => {
    if (!importPreviewData) {
      return;
    }

    const importedEntries = Array.isArray(importPreviewData.entries) ? importPreviewData.entries : [];
    if (importedEntries.length === 0) {
      showToast("Không có dữ liệu hợp lệ để áp dụng", "error");
      return;
    }

    const nextCellData: Record<string, string> = {};
    importedEntries.forEach((item) => {
      const classCode = (item.classCode ?? "").trim().toUpperCase();
      const subjectCode = (item.subjectCode ?? "").trim().toUpperCase();
      const day = Number(item.dayOfWeek);
      const periodStart = Number(item.periodStart);
      const periodEnd = Number(item.periodEnd);

      if (!classCode || !subjectCode || !day || !periodStart || !periodEnd) {
        return;
      }

      for (let period = periodStart; period <= periodEnd; period += 1) {
        nextCellData[`${classCode}_${day}_${period}`] = subjectCode;
      }
    });

    if (importPreviewData.versionName?.trim()) {
      setVersionName(importPreviewData.versionName.trim());
    }
    if (importPreviewData.effectiveFrom?.trim()) {
      setEffectiveFrom(importPreviewData.effectiveFrom.trim());
    }
    if (importPreviewData.effectiveTo?.trim()) {
      setEffectiveTo(importPreviewData.effectiveTo.trim());
    }

    setCellData(nextCellData);
    setShowImportPreview(false);
    setImportPreviewData(null);
    showToast(`Đã áp dụng ${importedEntries.length} dòng TKB vào lưới`, "success");
  };

  const handleCloseImportPreview = () => {
    setShowImportPreview(false);
    setImportPreviewData(null);
  };

  const handleSave = async (status: "DRAFT" | "LOCKED") => {
    if (isReadOnlyVersion) {
      showToast("Phiên bản này chỉ xem, không thể chỉnh sửa hoặc lưu.", "error");
      return;
    }

    if (!selectedAcademicYear || !selectedSemester) {
      showToast("Vui lòng chọn năm học và học kỳ", "error");
      return;
    }

    if (!versionName.trim()) {
      showToast("Vui lòng nhập tên thời khóa biểu", "error");
      return;
    }

    if (!effectiveFrom || !effectiveTo) {
      showToast("Vui lòng chọn khoảng thời gian hiệu lực", "error");
      return;
    }

    if (hasInvalidDateRange) {
      showToast("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", "error");
      return;
    }

    if (status === "LOCKED" && hasLockedOverlap) {
      showToast("Khoảng thời gian đang trùng với thời khóa biểu đã khóa. Chỉ có thể lưu nháp.", "error");
      return;
    }

    const entries = Object.entries(cellData)
      .map(([key, subjectCode]) => {
        const [classCode, dayRaw, periodRaw] = key.split("_");
        const day = Number(dayRaw);
        const period = Number(periodRaw);
        if (!classCode || !subjectCode || !day || !period) {
          return null;
        }

        return {
          classCode,
          subjectCode,
          dayOfWeek: day,
          periodStart: period,
          periodEnd: period,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (entries.length === 0) {
      showToast("Vui lòng chọn ít nhất một môn cho thời khóa biểu", "error");
      return;
    }

    try {
      setIsSaving(true);
      await teachingApi.upsertTimetableGrid({
        semesterCode: selectedSemester,
        academicYearCode: selectedAcademicYear,
        versionName: versionName.trim(),
        effectiveFrom,
        effectiveTo,
        status,
        entries,
      });

      if (status === "DRAFT") {
        showToast("Lưu nháp thời khóa biểu thành công", "success");
      } else {
        showToast("Lưu và khóa thời khóa biểu thành công", "success");
        router.push("/schedule");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Lỗi lưu thời khóa biểu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderGrid = (gradeLevel: string, classes: string[]) => {
    if (classes.length === 0) {
      return (
        <div key={gradeLevel} className="grid gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Khối {gradeLevel}</h3>
          <p className="text-sm text-slate-500">Không có lớp cho bộ lọc hiện tại.</p>
        </div>
      );
    }

    return (
      <div key={gradeLevel} className="grid gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Khối {gradeLevel}</h3>

        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="min-w-max border-collapse">
            <thead>
              <tr>
                <th className="w-[72px] border border-slate-300 bg-slate-100 px-1 py-2 text-center text-xs font-semibold">Thứ</th>
                <th className="w-[64px] border border-slate-300 bg-slate-100 px-1 py-2 text-center text-xs font-semibold">Tiết</th>
                {classes.map((classCode) => (
                  <th
                    key={classCode}
                    className="min-w-[132px] border border-slate-300 bg-slate-100 px-2 py-2 text-center text-xs font-semibold"
                  >
                    {classCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) =>
                periods.map((period, periodIndex) => (
                  <tr key={`${gradeLevel}_${day.value}_${period}`}>
                    {periodIndex === 0 && (
                      <td
                        rowSpan={periods.length}
                        className="w-[72px] border border-slate-300 bg-slate-50 px-1 py-2 text-center text-xs font-semibold"
                      >
                        {day.label}
                      </td>
                    )}
                    <td className="w-[64px] border border-slate-300 bg-slate-50 px-1 py-2 text-center text-xs font-medium">
                      Tiết {period}
                    </td>
                    {classes.map((classCode) => {
                      const cellKey = `${classCode}_${day.value}_${period}`;
                      const currentSubjectCode = cellData[cellKey] ?? "";
                      const hasSelectedValue = currentSubjectCode.trim().length > 0;

                      return (
                        <td
                          key={cellKey}
                          className={`border border-slate-300 p-1.5 text-center ${
                            hasSelectedValue ? "bg-emerald-50" : "bg-white"
                          }`}
                        >
                          <select
                            value={currentSubjectCode}
                            onChange={(event) => handleSubjectChange(classCode, day.value, period, event.target.value)}
                            disabled={isReadOnlyVersion}
                            className={`h-8 w-full rounded border px-1.5 text-xs transition ${
                              hasSelectedValue
                                ? "border-emerald-300 bg-emerald-100 font-medium text-emerald-900"
                                : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <option value="">-- Chọn môn --</option>
                            {subjectOptions.map((subject) => (
                              <option key={subject.code} value={subject.code}>
                                {subject.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6">
      <Panel className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Tạo thời khóa biểu</h2>

        {!isViewMode ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              ref={importFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFileChanged}
            />
            <Button tone="secondary" onClick={handleDownloadImportTemplate}>
              Tải template import
            </Button>
            <Button tone="secondary" onClick={handleSelectImportFile} disabled={isPreviewingImport}>
              {isPreviewingImport ? "Đang đọc file..." : "Import từ Excel"}
            </Button>
          </div>
        ) : null}

        {isViewMode ? (
          <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            Đây là màn hình xem chi tiết phiên bản thời khóa biểu. Header và lưới đã bị khóa chỉnh sửa.
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {sourceVersionLabel}
          </div>
        )}

        {isLoading ? <p className="mb-4 text-xs text-slate-500">Đang tải dữ liệu...</p> : null}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Năm học</label>
            <select
              value={selectedAcademicYear}
              onChange={(event) => setSelectedAcademicYear(event.target.value)}
              disabled={isReadOnlyVersion}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">-- Chọn năm học --</option>
              {yearOptions.map((year) => (
                <option key={year.code} value={year.code}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
              disabled={isReadOnlyVersion}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="HK1">Học kỳ 1</option>
              <option value="HK2">Học kỳ 2</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Ca học</label>
            <select
              value={selectedShift}
              onChange={(event) => setSelectedShift(event.target.value as Shift)}
              disabled={isReadOnlyVersion}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="MORNING">Ca sáng</option>
              <option value="AFTERNOON">Ca chiều</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Khối</label>
            <select
              value={selectedGrade}
              onChange={(event) => setSelectedGrade(event.target.value as GradeLevel)}
              disabled={isReadOnlyVersion}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Tên thời khóa biểu</label>
            <input
              value={versionName}
              onChange={(event) => setVersionName(event.target.value)}
              disabled={isReadOnlyVersion}
              placeholder="Ví dụ: TKB HK1 - Khối 10 tuần 1-8"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Hiệu lực từ ngày</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
              disabled={isReadOnlyVersion}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Hiệu lực đến ngày</label>
            <input
              type="date"
              value={effectiveTo}
              onChange={(event) => setEffectiveTo(event.target.value)}
              disabled={isReadOnlyVersion}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Phiên bản đã có (mặc định mới nhất)</label>
            <select
              value={selectedVersionId}
              onChange={(event) => handleVersionSelectionChange(event.target.value)}
              disabled={isLoadingVersions || isReadOnlyVersion}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">-- Chọn phiên bản để xem/chỉnh --</option>
              {timetableVersions.map((item) => (
                <option key={item.versionId} value={item.versionId}>
                  {item.versionName} (v{item.versionNo} - {item.status} - {item.effectiveFrom || "?"} đến {item.effectiveTo || "?"})
                </option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {isViewMode
              ? "Chế độ xem chi tiết chỉ mở dữ liệu của phiên bản đã chọn."
              : selectedVersionId
                ? "Đang nạp dữ liệu từ phiên bản nguồn. Lưu sẽ tạo một version mới dựa trên header hiện tại."
                : "Chưa chọn phiên bản nguồn. Bạn đang tạo mới từ dữ liệu trống hoặc theo dữ liệu active hiện tại."}
          </div>
        </div>

        {hasInvalidDateRange ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
          </div>
        ) : null}

        {!hasInvalidDateRange && hasLockedOverlap ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Khoảng thời gian này trùng với ít nhất một thời khóa biểu đã khóa. Nút lưu thật sẽ bị khóa, nhưng vẫn có thể lưu nháp.
          </div>
        ) : null}
      </Panel>

      {Object.entries(classesForDisplay).map(([gradeLevel, classes]) => (
        <Panel key={gradeLevel} className="p-6">
          {renderGrid(gradeLevel, classes)}
        </Panel>
      ))}

      {isViewMode ? null : (
        <div className="flex flex-wrap gap-2">
          <Button className="h-11 px-5" tone="secondary" onClick={() => void handleSave("DRAFT")} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu nháp"}
          </Button>
          <Button
            className="h-11 px-5"
            tone="primary"
            onClick={() => void handleSave("LOCKED")}
            disabled={isSaving || hasInvalidDateRange || hasLockedOverlap}
          >
            {isSaving ? "Đang lưu..." : "Lưu và khóa"}
          </Button>
        </div>
      )}

      <ImportPreviewModal
        open={showImportPreview && Boolean(importPreviewData)}
        title="Preview import thời khóa biểu"
        description="Xem trước dữ liệu parse từ file Excel trước khi áp dụng vào lưới."
        onClose={handleCloseImportPreview}
        onConfirm={handleApplyImportedData}
        confirmLabel="Áp dụng vào lưới"
        confirmDisabled={!importPreviewData || (importPreviewData.validEntries ?? 0) === 0}
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Ô môn phát hiện</p>
              <p className="text-lg font-semibold text-slate-900">{importPreviewData?.totalDetectedCells ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Dòng hợp lệ</p>
              <p className="text-lg font-semibold text-emerald-700">{importPreviewData?.validEntries ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Dòng lỗi</p>
              <p className="text-lg font-semibold text-rose-700">{importPreviewData?.invalidEntries ?? 0}</p>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm sm:grid-cols-2">
            <p><span className="font-medium">Tên TKB:</span> {importPreviewData?.versionName || "-"}</p>
            <p><span className="font-medium">Năm học:</span> {importPreviewData?.academicYearCode || "-"}</p>
            <p><span className="font-medium">Học kỳ:</span> {importPreviewData?.semesterCode || "-"}</p>
            <p><span className="font-medium">Hiệu lực:</span> {importPreviewData?.effectiveFrom || "-"} → {importPreviewData?.effectiveTo || "-"}</p>
          </div>

          {(importPreviewData?.issues?.length ?? 0) > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-semibold text-amber-900">Các lỗi cần lưu ý (hiển thị tối đa 30 dòng)</p>
              <ul className="max-h-56 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-amber-900">
                {importPreviewData?.issues?.slice(0, 30).map((issue, idx) => (
                  <li key={`${issue.row}-${issue.column}-${idx}`}>
                    R{issue.row} C{issue.column}: {issue.classCode || "?"} - {issue.subjectCode || "?"} ({issue.message || "Lỗi dữ liệu"})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Không phát hiện lỗi. Có thể áp dụng trực tiếp vào lưới.
            </div>
          )}
        </div>
      </ImportPreviewModal>
    </div>
  );
}
