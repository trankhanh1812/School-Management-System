"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/features/dashboard/components/sidebar-nav";
import { TopNavbar } from "@/features/dashboard/components/top-navbar";
import { storageKeys } from "@/constants/storage-keys";
import { useAuthSession } from "@/hooks/use-auth-session";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

type AppShellProps = {
  children: ReactNode;
};

function formatRoleLabel(role?: string) {
  switch (role) {
    case "ADMIN":
      return "Quản trị viên";
    case "TEACHER":
      return "Giáo viên";
    case "STUDENT":
      return "Học sinh";
    case "PARENT":
      return "Phụ huynh";
    default:
      return "Người dùng";
  }
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isChat = pathname === "/chat";
  const { session } = useAuthSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.localStorage.getItem(storageKeys.sidebarCollapsed) === "true",
  );
  const isHydrated = true;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isHydrated) {
      window.localStorage.setItem(
        storageKeys.sidebarCollapsed,
        String(sidebarCollapsed),
      );
    }
  }, [sidebarCollapsed, isHydrated]);

  const userName = session?.user.fullName ?? "Người dùng";
  const roleLabel = formatRoleLabel(session?.user.role);

  return (
    <div className="mx-auto flex h-screen gap-4 w-[min(98vw,2500px)] overflow-hidden pl-3 pt-4 pb-0 sm:pl-4 xl:pl-5 2xl:w-[min(98.5vw,2800px)]">
      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-900/30 xl:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Đóng menu"
          />
          <aside className="fixed left-3 top-3 z-40 h-[calc(100vh-24px)] w-[min(86vw,320px)] xl:hidden">
            <Panel className="h-full overflow-hidden p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
                  Điều hướng
                </p>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-slate-700"
                  aria-label="Đóng menu"
                >
                  ×
                </button>
              </div>
              <div className="h-[calc(100%-44px)] overflow-y-auto pr-1">
                <SidebarNav collapsed={false} />
              </div>
            </Panel>
          </aside>
        </>
      ) : null}

      <aside
        suppressHydrationWarning
        className={`hidden shrink-0 transition-[width] duration-200 xl:block ${
          isHydrated && sidebarCollapsed
            ? "w-[92px]"
            : "w-[280px] 2xl:w-[320px]"
        }`}
      >
        <Panel className="flex h-full flex-col p-2">
          {/* overflow-hidden removed — replaced with overflow-visible so collapsed
              icons are never clipped; the nav scroll area handles its own overflow */}
          {/* ── TOP: logo + collapse button ── */}
          <div
            suppressHydrationWarning
            className={`shrink-0 grid gap-3 ${isHydrated && sidebarCollapsed ? "justify-items-center" : ""}`}
          >
            <div
              suppressHydrationWarning
              className={`w-full rounded-2xl border border-slate-200 bg-white ${
                isHydrated && sidebarCollapsed ? "px-3 py-4 text-center" : "p-4"
              }`}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 font-mono text-sm font-bold text-white">
                SMS
              </div>
              {isHydrated && !sidebarCollapsed ? (
                <>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Hệ thống quản lý trường học
                  </p>
                  <h1 className="mt-2 text-xl font-bold text-slate-950">
                    Bảng điều khiển
                  </h1>
                </>
              ) : isHydrated ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  SMS
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              suppressHydrationWarning
              className={`inline-flex h-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50/80 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 ${
                isHydrated && sidebarCollapsed ? "w-11" : "w-full gap-2"
              }`}
              aria-label={
                sidebarCollapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng"
              }
              title={
                sidebarCollapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng"
              }
            >
              <span aria-hidden="true">
                {isHydrated && sidebarCollapsed ? "»" : "«"}
              </span>
              {isHydrated && !sidebarCollapsed ? <span>Thu gọn</span> : null}
            </button>
          </div>

          {/* ── MIDDLE: nav tabs — scrollable ── */}
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:thin] [scrollbar-color:theme(colors.sky.200)_transparent]">
            <SidebarNav collapsed={isHydrated ? sidebarCollapsed : false} />
          </div>

          {/* ── BOTTOM: semester info — fixed ── */}
          <div
            suppressHydrationWarning
            className={`mt-4 shrink-0 rounded-[1.5rem] border border-sky-100 bg-sky-50/80 ${
              isHydrated && sidebarCollapsed ? "px-3 py-4 text-center" : "p-4"
            }`}
          >
            {isHydrated && sidebarCollapsed ? (
              <div className="grid gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                  HK
                </p>
                <p className="text-sm font-semibold text-slate-950">26-27</p>
              </div>
            ) : isHydrated ? (
              <>
                <p className="text-sm font-semibold text-sky-800">
                  Năm học đang chọn
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  2026 - 2027
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Học kỳ II đang mở nhập điểm và đồng bộ học bạ điện tử.
                </p>
                <ButtonLink
                  href="/reports"
                  tone="secondary"
                  className="mt-4 w-full"
                >
                  Mở báo cáo nhanh
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-sky-800">
                  Năm học đang chọn
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  2026 - 2027
                </p>
              </>
            )}
          </div>
        </Panel>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden pr-3 pt-0 sm:pr-4 xl:pr-5">
        <TopNavbar
          userName={userName}
          roleLabel={roleLabel}
          roleCode={session?.user.role}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        {/* Chat fills remaining height; all other pages scroll inside this column */}
        {isChat ? (
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        ) : (
          <div className="-mr-3 flex-1 overflow-y-auto pb-4 pr-3 sm:-mr-4 sm:pr-4 xl:-mr-5 xl:pr-5">
            <div className="grid gap-4">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
