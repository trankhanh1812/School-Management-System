"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Kiểm tra", href: "/scores/exams" },
  { label: "Điểm số", href: "/scores/gradebook" },
] as const;

export function ScoreModuleTabs() {
  const pathname = usePathname();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2">
      <div className="grid gap-2 md:grid-cols-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "border-sky-500 bg-sky-500 text-white shadow-[0_10px_20px_rgba(14,116,255,0.22)]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <p>{tab.label}</p>
              <p className={`mt-1 text-xs font-medium ${active ? "text-sky-100" : "text-slate-500"}`}>
                {tab.href === "/scores/exams" ? "Quản lý đợt kiểm tra" : "Nhập, duyệt và công bố điểm"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
