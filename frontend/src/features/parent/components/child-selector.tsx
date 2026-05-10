"use client";

import type { LinkedChild } from "@/features/parent/api";

type ChildSelectorProps = {
  children: LinkedChild[];
  selectedCode: string;
  onSelect: (code: string) => void;
};

function avatarLabel(child: LinkedChild) {
  if (child.avatarLabel) return child.avatarLabel;
  const parts = child.fullName.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function ChildSelector({ children, selectedCode, onSelect }: ChildSelectorProps) {
  if (children.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ nhà trường.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {children.map((child) => {
        const isSelected = child.studentCode === selectedCode;
        return (
          <button
            key={child.studentCode}
            type="button"
            onClick={() => onSelect(child.studentCode)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition ${
              isSelected
                ? "border-sky-200 bg-sky-50 text-sky-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {avatarLabel(child)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{child.fullName}</p>
              <p className={`text-xs truncate ${isSelected ? "text-sky-600" : "text-slate-500"}`}>
                {child.className ?? "—"} · {child.academicYear ?? "—"}
              </p>
            </div>
            {isSelected && (
              <span className="ml-1 text-sky-500 text-xs">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
