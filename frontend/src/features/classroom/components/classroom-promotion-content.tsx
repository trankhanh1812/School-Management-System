"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { classroomApi, type PromotionImportPreviewResponse } from "@/features/classroom/api";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { PromotionBoard } from "@/features/classroom/components/promotion-board";
import { usePromotionBoardData } from "@/features/classroom/classroom-client-data";
import { PromotionImportPreview } from "@/features/classroom/components/promotion-import-preview";
import { useAuthSession } from "@/hooks";
import { useToast } from "@/shared/components/toast-provider";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export function ClassroomPromotionContent() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const { plans, isLoading, error, refresh } = usePromotionBoardData();
  const canImport = session?.user.role === "ADMIN";
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<PromotionImportPreviewResponse | null>(null);
  const [isPreviewingImport, setIsPreviewingImport] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

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
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được template xét lên lớp", "error");
    }
  };

  const handleSelectImportFile = () => {
    importFileRef.current?.click();
  };

  const handleImportFileChanged = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsPreviewingImport(true);
    try {
      const response = await classroomApi.previewPromotionImport(file);
      setPendingImportFile(file);
      setImportPreviewData(response.data ?? null);
      setShowImportPreview(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tạo được preview xét lên lớp", "error");
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
    if (!pendingImportFile) {
      return;
    }

    setIsImporting(true);
    try {
      await classroomApi.importPromotion(pendingImportFile);
      await refresh();
      handleCloseImportPreview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không import được xét lên lớp", "error");
    } finally {
      setIsImporting(false);
    }
  };

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
                <Button tone="secondary" onClick={() => void handleDownloadImportTemplate()}>
                  Tải mẫu xét lên lớp
                </Button>
                <Button tone="secondary" onClick={handleSelectImportFile} disabled={isPreviewingImport || isImporting}>
                  {isPreviewingImport ? "Đang xem trước..." : "Import Excel"}
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
        previewData={importPreviewData ?? { importId: "", totalRecords: 0, validRecords: 0, invalidRecords: 0, rows: [], issues: [] }}
        onImportComplete={handleImportFromPreview}
        onCancel={handleCloseImportPreview}
      />

      {error && (
        <Panel className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu xét lên lớp: {error}
        </Panel>
      )}

      {isLoading ? (
        <Panel className="p-4 text-sm text-slate-500">Đang tải dữ liệu xét lên lớp...</Panel>
      ) : (
        <PromotionBoard plans={plans} />
      )}
    </div>
  );
}
