"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  classroomApi,
  type PromotionImportPreviewResponse,
  type PromotionPlanApiRecord,
} from "@/features/classroom/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { PromotionBoard } from "@/features/classroom/components/promotion-board";
import { usePromotionBoardData } from "@/features/classroom/classroom-client-data";
import { PromotionImportPreview } from "@/features/classroom/components/promotion-import-preview";
import { useAuthSession } from "@/hooks";
import { useToast } from "@/shared/components/toast-provider";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

const ACTION_LABEL: Record<string, string> = {
  promote: "Lên lớp",
  repeat: "Lưu ban",
  transfer: "Chuyển lớp",
  graduate: "Tốt nghiệp",
};

const ACTION_STYLE: Record<string, string> = {
  promote: "bg-emerald-100 text-emerald-800",
  repeat: "bg-amber-100 text-amber-800",
  transfer: "bg-sky-100 text-sky-800",
  graduate: "bg-violet-100 text-violet-800",
};

export function ClassroomPromotionContent() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const { plans, isLoading, error, refresh } = usePromotionBoardData();
  const canImport = session?.user.role === "ADMIN";

  // Import state
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] =
    useState<PromotionImportPreviewResponse | null>(null);
  const [isPreviewingImport, setIsPreviewingImport] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Auto-calculate state
  const [showAutoCalc, setShowAutoCalc] = useState(false);
  const [autoCalcClass, setAutoCalcClass] = useState("");
  const [autoCalcSemester, setAutoCalcSemester] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoCalcResults, setAutoCalcResults] = useState<
    PromotionPlanApiRecord[]
  >([]);
  const [autoCalcError, setAutoCalcError] = useState("");

  // Dropdown options for auto-calculate
  const [classOptions, setClassOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load class list when auto-calc panel opens
  useEffect(() => {
    if (!showAutoCalc || classOptions.length > 0) return;
    setLoadingOptions(true);
    classroomApi
      .list({ scope: "all", limit: 500 })
      .then((res) => {
        const rows = res.data ?? [];
        const opts = rows
          .filter((r) => r.classCode)
          .map((r) => ({
            value: r.classCode!,
            label:
              r.classCode! +
              (r.className && r.className !== r.classCode
                ? ` — ${r.className}`
                : "") +
              (r.academicYear ? ` (${r.academicYear})` : ""),
          }));
        setClassOptions(opts);
        if (opts.length > 0 && !autoCalcClass) {
          setAutoCalcClass(opts[0].value);
        }
      })
      .catch(() => {
        /* silent */
      })
      .finally(() => setLoadingOptions(false));
  }, [showAutoCalc]);

  // ── Import handlers ──────────────────────────────────────────────────────

  const handleDownloadImportTemplate = async () => {
    try {
      const blob = await classroomApi.downloadPromotionImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Template_XetLenLop.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không tải được template xét lên lớp",
        "error",
      );
    }
  };

  const handleSelectImportFile = () => {
    importFileRef.current?.click();
  };

  const handleImportFileChanged = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsPreviewingImport(true);
    try {
      const response = await classroomApi.previewPromotionImport(file);
      setPendingImportFile(file);
      setImportPreviewData(response.data ?? null);
      setShowImportPreview(true);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không tạo được preview xét lên lớp",
        "error",
      );
    } finally {
      setIsPreviewingImport(false);
    }
  };

  const handleCloseImportPreview = () => {
    setShowImportPreview(false);
    setImportPreviewData(null);
    setPendingImportFile(null);
  };

  const handleImportFromPreview = async () => {
    if (!pendingImportFile) return;
    setIsImporting(true);
    try {
      await classroomApi.importPromotion(pendingImportFile);
      await refresh();
      handleCloseImportPreview();
      showToast("Import xét lên lớp thành công", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không import được xét lên lớp",
        "error",
      );
    } finally {
      setIsImporting(false);
    }
  };

  // ── Auto-calculate handlers ───────────────────────────────────────────────

  const handleAutoCalculate = async () => {
    if (!autoCalcClass.trim()) {
      showToast("Vui lòng nhập mã lớp", "error");
      return;
    }

    setIsCalculating(true);
    setAutoCalcError("");
    setAutoCalcResults([]);
    try {
      const response = await classroomApi.autoCalculatePromotion(
        autoCalcClass.trim(),
        autoCalcSemester.trim() || undefined,
      );
      const rows = response.data ?? [];
      if (rows.length === 0) {
        setAutoCalcError(
          "Không có dữ liệu để tính toán. Kiểm tra lại mã lớp và học kỳ.",
        );
      } else {
        setAutoCalcResults(rows);
        showToast(`Đã tính toán ${rows.length} học sinh`, "success");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không tính toán được";
      setAutoCalcError(msg);
      showToast(msg, "error");
    } finally {
      setIsCalculating(false);
    }
  };

  const promoteCounts = autoCalcResults.reduce<Record<string, number>>(
    (acc, r) => {
      const key = r.action ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Classes / Promotion"
        title="Trung tâm xét lên lớp, lưu ban và chuyển lớp"
        description="Tổng hợp phương án lên lớp theo từng lớp học, hỗ trợ rà soát và phê duyệt tập trung."
        actions={
          <>
            {canImport ? (
              <>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportFileChanged}
                />
                <Button
                  tone="secondary"
                  onClick={() => void handleDownloadImportTemplate()}
                >
                  Tải mẫu xét lên lớp
                </Button>
                <Button
                  tone="secondary"
                  onClick={handleSelectImportFile}
                  disabled={isPreviewingImport || isImporting}
                >
                  {isPreviewingImport ? "Đang xem trước..." : "Nhập từ Excel"}
                </Button>
                <Button
                  tone={showAutoCalc ? "ghost" : "secondary"}
                  onClick={() => setShowAutoCalc((v) => !v)}
                >
                  {showAutoCalc ? "Ẩn tính toán tự động" : "Tính toán tự động"}
                </Button>
              </>
            ) : null}
            <ButtonLink href="/classes" tone="secondary">
              Quay lại lớp học
            </ButtonLink>
            <ButtonLink href="/students">Mở danh sách học sinh</ButtonLink>
          </>
        }
      />

      <PromotionImportPreview
        open={showImportPreview && Boolean(importPreviewData)}
        previewData={
          importPreviewData ?? {
            importId: "",
            totalRecords: 0,
            validRecords: 0,
            invalidRecords: 0,
            rows: [],
            issues: [],
          }
        }
        onImportComplete={handleImportFromPreview}
        onCancel={handleCloseImportPreview}
      />

      {/* ── Auto-calculate panel ── */}
      {showAutoCalc && canImport ? (
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Tính toán tự động xét lên lớp
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Hệ thống tự động tính dựa trên điểm trung bình, hạnh kiểm và quy
                tắc xếp loại đã cấu hình.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div className="grid gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lớp học <span className="text-rose-500">*</span>
              </label>
              <select
                value={autoCalcClass}
                onChange={(e) => setAutoCalcClass(e.target.value)}
                disabled={loadingOptions}
                className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-sky-400 focus:outline-none"
              >
                <option value="">
                  {loadingOptions ? "Đang tải..." : "Chọn lớp"}
                </option>
                {classOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Học kỳ (tuỳ chọn)
              </label>
              <select
                value={autoCalcSemester}
                onChange={(e) => setAutoCalcSemester(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-sky-400 focus:outline-none"
              >
                <option value="">Tất cả học kỳ</option>
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => void handleAutoCalculate()}
                disabled={isCalculating || !autoCalcClass.trim()}
              >
                {isCalculating ? "Đang tính..." : "Tính toán"}
              </Button>
            </div>
          </div>

          {autoCalcError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {autoCalcError}
            </div>
          ) : null}

          {autoCalcResults.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {/* Summary chips */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(promoteCounts).map(([action, count]) => (
                  <span
                    key={action}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${ACTION_STYLE[action] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {ACTION_LABEL[action] ?? action}: {count}
                  </span>
                ))}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Tổng: {autoCalcResults.length} học sinh
                </span>
              </div>

              {/* Results table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Học sinh</th>
                      <th className="px-4 py-2.5 text-left">Lớp hiện tại</th>
                      <th className="px-4 py-2.5 text-left">Lớp đề xuất</th>
                      <th className="px-4 py-2.5 text-left">Năm học mới</th>
                      <th className="px-4 py-2.5 text-left">Kết quả</th>
                      <th className="px-4 py-2.5 text-left">Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {autoCalcResults.map((row) => (
                      <tr
                        key={row.studentCode}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {row.studentName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.studentCode}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.currentClass ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.proposedClass ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.nextAcademicYear ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLE[row.action ?? ""] ?? "bg-slate-100 text-slate-700"}`}
                          >
                            {ACTION_LABEL[row.action ?? ""] ??
                              row.action ??
                              "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {row.reason ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-400">
                Kết quả trên chỉ là đề xuất tự động. Vui lòng rà soát trước khi
                xác nhận chính thức qua chức năng Nhập từ Excel.
              </p>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {/* ── Error / loading / board ── */}
      {error ? (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu xét lên lớp: {error}
        </Panel>
      ) : null}

      {isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">
          Đang tải dữ liệu xét lên lớp...
        </Panel>
      ) : (
        <PromotionBoard plans={plans} />
      )}
    </div>
  );
}
