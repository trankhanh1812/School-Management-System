"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { notificationApi } from "@/features/notification/api";
import {
  dashboardLinks,
  parentDashboardLinks,
  studentDashboardLinks,
  teacherDashboardLinks,
} from "@/shared/config/navigation";
import { useAuthSession } from "@/hooks";

type IconProps = {
  className?: string;
};

function NavIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const iconMap: Record<string, (props: IconProps) => ReactElement> = {
  "/dashboard": (props) => <NavIcon {...props} path="M4 13h7V4H4zm9 7h7V11h-7zm0-16v5h7V4zM4 20h7v-5H4z" />,
  "/students": (props) => <NavIcon {...props} path="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0z" />,
  "/teachers": (props) => <NavIcon {...props} path="M3 7l9-4l9 4l-9 4zM7 10v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4M21 9v6" />,
  "/classes": (props) => <NavIcon {...props} path="M4 5h16v12H4zM8 21h8M12 17v4" />,
  "/subjects": (props) => <NavIcon {...props} path="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3zm0 0v16a3 3 0 0 1 3-3h11" />,
  "/students/conduct": (props) => <NavIcon {...props} path="M4 6h16M7 6v12m10-12v12M6 18h12" />,
  "/teaching-assignments": (props) => <NavIcon {...props} path="M4 6h6v6H4zm10 0h6v6h-6zM4 16h6v4H4zm10 0h6v4h-6" />,
  "/scores": (props) => <NavIcon {...props} path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  "/attendance": (props) => <NavIcon {...props} path="M9 11l3 3L22 4M21 12v7H3V5h11" />,
  "/schedule": (props) => <NavIcon {...props} path="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
  "/reports": (props) => <NavIcon {...props} path="M4 19V5m5 14V9m5 10V13m5 6V7" />,
  "/notifications": (props) => <NavIcon {...props} path="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />,
  "/system-settings": (props) => <NavIcon {...props} path="M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zm8.94 4a7.96 7.96 0 0 0-.18-1.67l2.06-1.6l-2-3.46l-2.5 1a8.1 8.1 0 0 0-2.9-1.67L15 2h-6l-.42 2.6a8.1 8.1 0 0 0-2.9 1.67l-2.5-1l-2 3.46l2.06 1.6A8.2 8.2 0 0 0 3.06 12c0 .57.06 1.12.18 1.67l-2.06 1.6l2 3.46l2.5-1a8.1 8.1 0 0 0 2.9 1.67L9 22h6l.42-2.6a8.1 8.1 0 0 0 2.9-1.67l2.5 1l2-3.46l-2.06-1.6c.12-.55.18-1.1.18-1.67z" />,
  // Student-specific icons
  "/my-profile": (props) => <NavIcon {...props} path="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-5.3 0-8 2.7-8 6v2h16v-2c0-3.3-2.7-6-8-6z" />,
  "/my-scores": (props) => <NavIcon {...props} path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  "/my-transcript": (props) => <NavIcon {...props} path="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3zm0 0v16a3 3 0 0 1 3-3h11" />,
  "/my-attendance": (props) => <NavIcon {...props} path="M9 11l3 3L22 4M21 12v7H3V5h11" />,
  "/my-schedule": (props) => <NavIcon {...props} path="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
  "/my-conduct": (props) => <NavIcon {...props} path="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z" />,
  "/my-exams": (props) => <NavIcon {...props} path="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />,
  "/chat": (props) => <NavIcon {...props} path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
};

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { session } = useAuthSession();
  const userRole = session?.user.role || "STUDENT";
  const userId = session?.user?.id;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      if (!userId) {
        if (isMounted) {
          setUnreadCount(0);
        }
        return;
      }

      try {
        const response = await notificationApi.unreadCount();
        if (isMounted) {
          setUnreadCount(response.data?.unreadCount ?? 0);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();

    function handleUnreadChange(event: Event) {
      const customEvent = event as CustomEvent<{ count?: number }>;
      const count = typeof customEvent.detail?.count === "number" ? customEvent.detail.count : 0;
      setUnreadCount(count);
    }

    window.addEventListener("notification-unread-changed", handleUnreadChange);
    return () => {
      isMounted = false;
      window.removeEventListener("notification-unread-changed", handleUnreadChange);
    };
  }, [userId]);

  // Determine which navigation links to use based on role
  let links = dashboardLinks;
  if (userRole === "STUDENT") {
    links = studentDashboardLinks;
  } else if (userRole === "PARENT") {
    links = parentDashboardLinks;
  } else if (userRole === "TEACHER") {
    links = teacherDashboardLinks;
  } else if (userRole === "ADMIN") {
    links = dashboardLinks;
  }

  return (
    <nav className="grid gap-2">
      {links.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = iconMap[item.href];

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`group rounded-2xl border text-sm font-medium transition ${
              isActive
                ? "border-sky-200 bg-sky-500 text-white shadow-[0_16px_35px_rgba(59,130,246,0.22)]"
                : "border-transparent bg-transparent text-slate-600 hover:border-sky-100 hover:bg-sky-50 hover:text-sky-900"
            } ${
              collapsed
                ? "flex min-h-14 items-center justify-center px-3 py-3"
                : "flex items-center gap-3 px-4 py-3.5"
            }`}
          >
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                isActive
                  ? "bg-white/18 text-white"
                  : "bg-white text-sky-700 ring-1 ring-sky-100 group-hover:bg-sky-100"
              }`}
            >
              {Icon ? <Icon className="h-5 w-5" /> : <span className="text-sm font-bold">•</span>}
            </span>
            {!collapsed ? <span>{item.label}</span> : null}
            {item.href === "/notifications" && unreadCount > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isActive ? "bg-white text-sky-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
            <span className={collapsed ? "sr-only" : "hidden"}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
