"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";

type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export function Modal({ open, title, description, onClose, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative w-full ${sizeClasses[size]} overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.25)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="space-y-1">
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          <Button tone="ghost" onClick={onClose} className="px-3 py-2 text-sm">
            Đóng
          </Button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}