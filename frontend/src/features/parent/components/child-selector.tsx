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
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ChildSelector({ children, selectedCode, onSelect }: ChildSelectorProps) {
  if (children.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ nhà trường.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {children.map((child) => {
        const isSelected = child.studentCode === selectedCode;
        return (
          <button
            key={child.studentCode}
            type="button"
            onClick={() => onSelect(child.studentCode)}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              isSelected
                ? "border-blue-400 bg-blue-600 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
              }`}
            >
              {avatarLabel(child)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{child.fullName}</p>
              <p className={`text-xs truncate ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                {child.className ?? "—"} · {child.academicYear ?? "—"}
              </p>
            </div>
            {isSelected && (
              <span className="ml-1 text-white text-xs font-bold">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
