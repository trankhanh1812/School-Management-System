"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { ChildSelector } from "@/features/parent/components/child-selector";
import { useParentProfile } from "@/features/parent/hooks";
import { useSelectedChild } from "@/features/parent/use-selected-child";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

const childQuickLinks = [
  { href: "/my-scores",      icon: "📊", label: "Điểm số",        description: "Bảng điểm và chi tiết từng đầu điểm",   color: "border-blue-200 bg-blue-50 hover:bg-blue-100",     iconBg: "bg-blue-600" },
  { href: "/my-exams",       icon: "📝", label: "Lịch thi",       description: "Lịch thi sắp tới theo môn học",          color: "border-orange-200 bg-orange-50 hover:bg-orange-100", iconBg: "bg-orange-500" },
  { href: "/my-transcript",  icon: "🎓", label: "Học bạ",         description: "Kết quả học tập qua các năm học",        color: "border-purple-200 bg-purple-50 hover:bg-purple-100", iconBg: "bg-purple-600" },
  { href: "/my-conduct",     icon: "⭐", label: "Hạnh kiểm",      description: "Đánh giá hạnh kiểm theo từng học kỳ",    color: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100", iconBg: "bg-yellow-500" },
  { href: "/my-attendance",  icon: "✅", label: "Điểm danh",      description: "Lịch sử có mặt, vắng mặt và đến trễ",   color: "border-green-200 bg-green-50 hover:bg-green-100",   iconBg: "bg-green-600" },
  { href: "/my-schedule",    icon: "📅", label: "Thời khóa biểu", description: "Lịch học theo tuần của lớp",             color: "border-cyan-200 bg-cyan-50 hover:bg-cyan-100",      iconBg: "bg-cyan-600" },
  { href: "/notifications",  icon: "🔔", label: "Thông báo",      description: "Thông báo từ nhà trường và giáo viên",   color: "border-red-200 bg-red-50 hover:bg-red-100",         iconBg: "bg-red-500" },
  { href: "/chat",           icon: "💬", label: "Chat",           description: "Nhắn tin với giáo viên và nhà trường",   color: "border-slate-200 bg-slate-50 hover:bg-slate-100",   iconBg: "bg-slate-700" },
];

export function ParentProfileContent() {
  const { profile, children, isLoading, error } = useParentProfile();
  const { selectedCode, setSelectedCode } = useSelectedChild();

  // Auto-select first child if none selected
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

      {/* Parent own info */}
      {profile && (
        <Panel className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid gap-0.5">
              <p className="text-lg font-bold text-slate-900">{profile.fullName}</p>
              <p className="text-sm text-slate-500">
                {profile.phone && <span>📞 {profile.phone}</span>}
                {profile.phone && profile.email && <span className="mx-2">·</span>}
                {profile.email && <span>✉️ {profile.email}</span>}
              </p>
              <span className="mt-1 inline-block w-fit rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-800">
                Phụ huynh
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* Child selector */}
      <Panel className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Con em đang theo dõi ({children.length})
        </h3>
        <ChildSelector
          children={children}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
        />
      </Panel>

      {/* Selected child summary */}
      {selectedChild && (
        <>
          <Panel className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
                {selectedChild.avatarLabel ??
                  selectedChild.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()}
              </div>
              <div className="flex-1 grid gap-1">
                <p className="text-lg font-bold text-slate-900">{selectedChild.fullName}</p>
                <p className="text-sm text-slate-500">
                  {selectedChild.studentCode} · Lớp {selectedChild.className} · {selectedChild.academicYear}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
                    Học sinh
                  </span>
                  <span
                    className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
                      selectedChild.status === "ACTIVE" || selectedChild.status === "Đang học"
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {selectedChild.status === "ACTIVE" ? "Đang học" : (selectedChild.status ?? "—")}
                  </span>
                  {selectedChild.canViewScore === false && (
                    <span className="inline-block rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-700">
                      Không xem được điểm
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* Quick links */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {childQuickLinks
              .filter((link) => {
                // Hide scores link if canViewScore is false
                if (link.href === "/my-scores" && selectedChild.canViewScore === false) return false;
                return true;
              })
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition ${link.color}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-lg ${link.iconBg}`}
                  >
                    {link.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{link.label}</p>
                    <p className="text-xs text-slate-600 truncate">{link.description}</p>
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
