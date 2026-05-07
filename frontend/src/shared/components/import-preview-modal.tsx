"use client";

import type { ReactNode } from "react";
import { Modal } from "@/shared/ui/modal";
import { Button } from "@/shared/ui/button";

type ImportPreviewModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  children: ReactNode;
};

export function ImportPreviewModal({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Import",
  confirmDisabled = false,
  confirmLoading = false,
  children,
}: ImportPreviewModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button tone="ghost" onClick={onClose} disabled={confirmLoading}>
            Huy
          </Button>
          <Button onClick={onConfirm} disabled={confirmDisabled || confirmLoading}>
            {confirmLoading ? "Dang nhap..." : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
