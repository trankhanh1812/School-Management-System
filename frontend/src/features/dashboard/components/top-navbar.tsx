"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/ui/button";

type TopNavbarProps = {
  userName: string;
  roleLabel: string;
  roleCode?: string;
  onOpenMobileNav?: () => void;
};

function formatRoleIcon(role?: string) {
  switch (role) {
    case "ADMIN":
      return "ADM";
    case "TEACHER":
      return "TCH";
    case "STUDENT":
      return "STD";
    case "PARENT":
      return "PAR";
    default:
      return "USR";
  }
}

export function TopNavbar({ userName, roleLabel, roleCode, onOpenMobileNav }: TopNavbarProps) {
  const router = useRouter();
  const { signOut } = useAuthSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function applyTheme(selectedTheme: "light" | "dark") {
    const html = document.documentElement;
    if (selectedTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    window.localStorage.setItem("theme", selectedTheme);
  }

  function handleThemeToggle() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  function handleLanguageChange(lang: string) {
    window.localStorage.setItem("language", lang);
    setIsLanguageOpen(false);
    // In a real app, you'd trigger language change here
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authService.logout();
    } catch {
      // Continue logout even if backend fails
    } finally {
      signOut();
      router.replace("/login");
      setIsSigningOut(false);
    }
  }

  const currentLanguage = typeof window !== "undefined" ? window.localStorage.getItem("language") || "vi" : "vi";

  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-sky-100/80 bg-white/88 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Greeting section */}
          <div className="flex items-center gap-3">
            {onOpenMobileNav ? (
              <button
                type="button"
                onClick={onOpenMobileNav}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-slate-700 transition hover:border-sky-300 hover:bg-sky-100 xl:hidden"
                aria-label="Mở menu điều hướng"
                title="Mở menu"
              >
                ☰
              </button>
            ) : null}
            <span className="inline-flex h-9 items-center justify-center rounded-lg bg-sky-100 px-2 font-mono text-xs font-bold tracking-[0.08em] text-sky-700">
              {formatRoleIcon(roleCode)}
            </span>
            <div>
              <p className="text-sm font-semibold text-sky-700">
                Xin chào, {userName}
              </p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {roleCode === "ADMIN" ? (
              <button
                onClick={() => router.push("/system-settings")}
                className="inline-flex h-9 items-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
                title="Cấu hình hệ thống"
              >
                Cấu hình
              </button>
            ) : null}

            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-slate-700 transition hover:border-sky-300 hover:bg-sky-100"
              title={theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
            >
              {theme === "light" ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.64 15.89v2.06h3.18v-2.06zm-9.5 6.12A9.53 9.53 0 0 1 3.1 12a9.52 9.52 0 0 1 9.04-12A9.52 9.52 0 0 1 21.18 12a9.53 9.53 0 0 1-9.04 10.01zM12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0-2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Language Selector */}
            <div ref={languageRef} className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-100"
                title="Chọn ngôn ngữ"
              >
                {currentLanguage.toUpperCase()}
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-sky-100 bg-white shadow-lg">
                  <button
                    onClick={() => handleLanguageChange("vi")}
                    className={`block w-full px-4 py-3 text-left text-sm transition hover:bg-sky-50 ${
                      currentLanguage === "vi" ? "font-semibold text-sky-700" : "text-slate-700"
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`block w-full px-4 py-3 text-left text-sm transition hover:bg-sky-50 ${
                      currentLanguage === "en" ? "font-semibold text-sky-700" : "text-slate-700"
                    }`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0284c7,#0ea5e9)] text-sm font-semibold text-white transition hover:brightness-105"
                title="Hồ sơ cá nhân"
              >
                {userName.charAt(0).toUpperCase()}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-sky-100 bg-white shadow-lg">
                  <div className="border-b border-sky-100 px-4 py-3">
                    <p className="font-semibold text-slate-900">{userName}</p>
                    <p className="text-xs text-slate-500">{roleLabel}</p>
                  </div>
                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsProfileOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-sky-50"
                  >
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => {
                      router.push("/profile/settings");
                      setIsProfileOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-sky-50"
                  >
                    Cài đặt
                  </button>
                  <div className="border-t border-sky-100 p-2">
                    <Button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      tone="secondary"
                      className="w-full"
                    >
                      {isSigningOut ? "Đang đăng xuất..." : "🚪 Đăng xuất"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logout Button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
