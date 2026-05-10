"use client";

import Link from "next/link";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { useMyStudentProfileData } from "@/features/student/student-client-data";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";

const quickLinks = [
  {
    href: "/my-scores",
    icon: "📊",
    label: "Điểm số",
    description: "Xem bảng điểm và chi tiết từng đầu điểm",
  },
  {
    href: "/my-exams",
    icon: "📝",
    label: "Lịch thi",
    description: "Xem lịch thi sắp tới theo môn học",
  },
  {
    href: "/my-transcript",
    icon: "🎓",
    label: "Học bạ",
    description: "Kết quả học tập qua các năm học",
  },
  {
    href: "/my-conduct",
    icon: "⭐",
    label: "Hạnh kiểm",
    description: "Đánh giá hạnh kiểm theo từng học kỳ",
  },
  {
    href: "/my-attendance",
    icon: "✅",
    label: "Điểm danh",
    description: "Lịch sử có mặt, vắng mặt và đến trễ",
  },
  {
    href: "/my-schedule",
    icon: "📅",
    label: "Thời khóa biểu",
    description: "Lịch học theo tuần của lớp",
  },
  {
    href: "/my-attendance/qr-scan",
    icon: "📷",
    label: "Hướng dẫn QR",
    description: "Cách điểm danh bằng camera điện thoại",
  },
  {
    href: "/notifications",
    icon: "🔔",
    label: "Thông báo",
    description: "Thông báo từ nhà trường và giáo viên",
  },
];

export function MyProfileContent() {
  const { student, source, isLoading, error } = useMyStudentProfileData();

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải...</div>;
  }

  if (!student) {
    return (
      <EmptyState
        title="Không tìm thấy hồ sơ cá nhân"
        description="Tài khoản hiện tại chưa được liên kết với hồ sơ học sinh."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Hồ sơ"
        title={`Xin chào, ${student.fullName}`}
        description="Tổng quan tài khoản học sinh. Chọn mục bên dưới để xem chi tiết."
      />

      <StudentDataState source={source} error={error} />

      {/* Profile summary card */}
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-bold text-sky-700">
            {student.avatarLabel}
          </div>
          <div className="flex-1 grid gap-1">
            <p className="text-xl font-bold text-slate-900">{student.fullName}</p>
            <p className="text-sm text-slate-600">
              {student.studentCode} · Lớp {student.className} · {student.academicYear}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="inline-block rounded-full bg-sky-50 px-3 py-0.5 text-xs font-medium text-sky-700">
                Học sinh
              </span>
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
                  student.status === "ACTIVE" || student.status === "Đang học"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {student.status === "ACTIVE" ? "Đang học" : student.status}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Quick access grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
              {link.icon}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{link.label}</p>
              <p className="text-xs text-slate-600 truncate">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Personal info */}
      <Panel className="p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Thông tin cá nhân</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-slate-500">Họ và tên</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.fullName}</p>
          </div>
          <div>
            <p className="text-slate-500">Mã học sinh</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.studentCode}</p>
          </div>
          <div>
            <p className="text-slate-500">Email</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.email}</p>
          </div>
          <div>
            <p className="text-slate-500">Ngày sinh</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.dateOfBirth}</p>
          </div>
          <div>
            <p className="text-slate-500">Giới tính</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.gender}</p>
          </div>
          <div>
            <p className="text-slate-500">Điện thoại</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.phone}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-slate-500">Địa chỉ</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.address}</p>
          </div>
        </div>
      </Panel>

      {/* Academic info */}
      <Panel className="p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Thông tin học tập</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-slate-500">Lớp</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.className}</p>
          </div>
          <div>
            <p className="text-slate-500">Năm học</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.academicYear}</p>
          </div>
          <div>
            <p className="text-slate-500">GVCN</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.homeroomTeacher}</p>
          </div>
          <div>
            <p className="text-slate-500">Hạnh kiểm</p>
            <p className="mt-0.5 font-medium text-slate-900">{student.conduct}</p>
          </div>
        </div>
      </Panel>

      {/* Parents */}
      {student.parents && student.parents.length > 0 && (
        <Panel className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">Phụ huynh / Người giám hộ</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {student.parents.map((parent, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-4 text-sm">
                <p className="font-semibold text-slate-900">{parent.fullName}</p>
                <p className="text-slate-500">{parent.role}</p>
                <div className="mt-2 grid gap-1 text-slate-600">
                  <p>📞 {parent.phone}</p>
                  <p>✉️ {parent.email}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <p className="text-xs text-slate-500">
        Để cập nhật thông tin cá nhân, vui lòng liên hệ phòng giáo vụ hoặc quản trị viên.
      </p>
    </div>
  );
}
