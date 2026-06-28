"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

const quickLinks = [
  { href: "/my-scores",     icon: "📊", label: "Điểm số",        description: "Bảng điểm và chi tiết từng đầu điểm" },
  { href: "/my-exams",      icon: "📝", label: "Lịch thi",        description: "Lịch thi sắp tới theo môn học" },
  { href: "/my-transcript", icon: "🎓", label: "Học bạ",          description: "Kết quả học tập qua các năm học" },
  { href: "/my-conduct",    icon: "⭐", label: "Hạnh kiểm",       description: "Đánh giá hạnh kiểm theo từng học kỳ" },
  { href: "/my-attendance", icon: "✅", label: "Điểm danh",       description: "Lịch sử có mặt, vắng mặt và đến trễ" },
  { href: "/my-schedule",   icon: "📅", label: "Thời khóa biểu",  description: "Lịch học theo tuần của lớp" },
  { href: "/notifications", icon: "🔔", label: "Thông báo",       description: "Thông báo từ nhà trường và giáo viên" },
  { href: "/chat",          icon: "💬", label: "Chat",            description: "Nhắn tin với giáo viên và nhà trường" },
];

export function ParentProfileContent() {
  const { profile, children, isLoading, error } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();

  if (!selectedCode && children.length > 0 && children[0]) {
    setSelectedCode(children[0].studentCode);
  }

  const selectedChild = children.find((c) => c.studentCode === selectedCode);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải thông tin...</div>;
  }

  if (!profile && error) {
    return (
      <EmptyState
        title="Không tìm thấy thông tin phụ huynh"
        description={error || "Tài khoản chưa được liên kết. Vui lòng liên hệ nhà trường."}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Phụ huynh"
        title={`Xin chào, ${profile?.fullName ?? "Phụ huynh"}`}
        description="Theo dõi tình hình học tập của con em. Chọn con để xem thông tin chi tiết."
      />

      {/* Parent info */}
      {profile && (
        <Panel className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-base font-bold text-sky-700">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid gap-0.5">
              <p className="font-semibold text-slate-900">{profile.fullName}</p>
              <p className="text-sm text-slate-500">
                {[profile.phone, profile.email].filter(Boolean).join(" · ")}
              </p>
              <span className="mt-1 inline-block w-fit rounded-full bg-sky-50 px-3 py-0.5 text-xs font-medium text-sky-700">
                Phụ huynh
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* Child selector */}
      <Panel className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Con em đang theo dõi ({children.length})
        </p>
        <ChildSelector children={children} selectedCode={selectedCode} onSelect={setSelectedCode} />
      </Panel>

      {/* Selected child */}
      {selectedChild && (
        <>
          <Panel className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-700">
                {(selectedChild.avatarLabel ?? selectedChild.fullName.split(" ").slice(-1)[0]?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 grid gap-1">
                <p className="font-semibold text-slate-900">{selectedChild.fullName}</p>
                <p className="text-sm text-slate-500">
                  {selectedChild.studentCode} · Lớp {selectedChild.className} · {selectedChild.academicYear}
                </p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">
                    Học sinh
                  </span>
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">
                    {selectedChild.status === "ACTIVE" ? "Đang học" : (selectedChild.status ?? "—")}
                  </span>
                  {selectedChild.canViewScore === false && (
                    <span className="inline-block rounded-full bg-rose-50 px-3 py-0.5 text-xs font-medium text-rose-600">
                      Không xem được điểm
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* Quick links */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks
              .filter((link) => !(link.href === "/my-scores" && selectedChild.canViewScore === false))
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                    {link.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                    <p className="text-xs text-slate-500 truncate">{link.description}</p>
                  </div>
                </Link>
              ))}
          </div>
        </>
      )}

      {children.length === 0 && !isLoading && (
        <EmptyState
          title="Chưa có con em được liên kết"
          description="Vui lòng liên hệ nhà trường để được liên kết tài khoản với học sinh."
        />
      )}
    </div>
  );
}
