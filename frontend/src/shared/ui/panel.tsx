import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={`rounded-[1.5rem] border border-[var(--line)]/85 bg-[var(--panel)] shadow-[0_14px_40px_rgba(15,23,42,0.09)] backdrop-blur-sm transition-shadow hover:shadow-[0_18px_48px_rgba(15,23,42,0.12)] ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
