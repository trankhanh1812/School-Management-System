"use client";

import { useMemo, useState } from "react";
import type { PromotionImportPreviewResponse } from "@/features/classroom/api";
import { useToast } from "@/shared/components/toast-provider";
import { ImportPreviewModal } from "@/shared/components/import-preview-modal";

type PromotionImportPreviewProps = {
  open: boolean;
  previewData: PromotionImportPreviewResponse;
  onImportComplete: () => Promise<void>;
  onCancel: () => void;
};

export function PromotionImportPreview({ open, previewData, onImportComplete, onCancel }: PromotionImportPreviewProps) {
  const { showToast } = useToast();
  const [importing, setImporting] = useState(false);

  const rows = useMemo(() => previewData.rows ?? [], [previewData.rows]);
  const visibleRows = rows.slice(0, 20);

  const handleImport = async () => {
    if ((previewData.validRecords ?? 0) === 0) {
      return;
    }

    setImporting(true);
    try {
      await onImportComplete();
      showToast("Đã import xét lên lớp thành công", "success");
    } finally {
      setImporting(false);
    }
  };

  return (
    <ImportPreviewModal
      open={open}
      title="Preview import xét lên lớp"
      description="Kiểm tra danh sách xét lớp trước khi ghi vào hệ thống."
      onClose={onCancel}
      onConfirm={handleImport}
      confirmLabel="Xác nhận import"
      confirmDisabled={importing || (previewData.validRecords ?? 0) === 0}
      confirmLoading={importing}
    >
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tổng dòng</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{previewData.totalRecords ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Hợp lệ</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{previewData.validRecords ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Có lỗi</p>
            <p className="mt-2 text-2xl font-semibold text-rose-700">{previewData.invalidRecords ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Import ID</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-700">{previewData.importId || "-"}</p>
          </div>
        </div>

        {(previewData.issues?.length ?? 0) > 0 ? (
          <div className="grid gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-semibold">Lỗi phát hiện</p>
            <ul className="grid gap-1">
              {previewData.issues.slice(0, 10).map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Dòng</th>
                  <th className="px-4 py-3 text-left">Học sinh</th>
                  <th className="px-4 py-3 text-left">Lớp cũ</th>
                  <th className="px-4 py-3 text-left">Năm học cũ</th>
                  <th className="px-4 py-3 text-left">Lớp mới</th>
                  <th className="px-4 py-3 text-left">Năm học mới</th>
                  <th className="px-4 py-3 text-left">Kết quả</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.studentCode}`} className={`border-t border-slate-100 ${row.hasErrors ? "bg-rose-50" : "bg-white"}`}>
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3">
                      <div className="grid">
                        <span className="font-medium text-slate-900">{row.studentCode}</span>
                        <span className="text-xs text-slate-500">{row.studentName || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.currentClass}</td>
                    <td className="px-4 py-3">{row.currentAcademicYear}</td>
                    <td className="px-4 py-3">{row.proposedClass || "-"}</td>
                    <td className="px-4 py-3">{row.nextAcademicYear}</td>
                    <td className="px-4 py-3 capitalize">{row.action}</td>
                    <td className="px-4 py-3">
                      {row.hasErrors ? (
                        <span className="font-medium text-rose-700">Có lỗi</span>
                      ) : (
                        <span className="font-medium text-emerald-700">Hợp lệ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > visibleRows.length ? (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Đang hiển thị {visibleRows.length} / {rows.length} dòng đầu tiên.
            </div>
          ) : null}
        </div>
      </div>
    </ImportPreviewModal>
  );
}