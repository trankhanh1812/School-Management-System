"use client";

import Link from "next/link";
import { useAuthSession } from "@/hooks";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { Panel } from "@/shared/ui/panel";
import { ButtonLink } from "@/shared/ui/button";

export function StudentDashboard() {
  const { session } = useAuthSession();
  const studentName = session?.user.fullName || "Học sinh";

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Chào mừng"
        title={`Hồ sơ của ${studentName}`}
        description="Xem thông tin cá nhân, điểm số, điểm danh, thời khóa biểu và thông báo từ nhà trường."
      />

      {/* Profile Card */}
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Thông tin cơ bản</h3>
            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <p className="text-slate-600">Họ và tên</p>
                <p className="font-medium text-slate-900">{session?.user.fullName}</p>
              </div>
              <div>
                <p className="text-slate-600">Email</p>
                <p className="font-medium text-slate-900">{session?.user.email}</p>
              </div>
              <div>
                <p className="text-slate-600">Vai trò</p>
                <p className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
                  Học sinh
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:justify-end">
            <ButtonLink href="/my-profile" className="w-full">
              Xem hồ sơ chi tiết
            </ButtonLink>
            <ButtonLink href="/my-transcript" tone="secondary" className="w-full">
              Xem học bạ
            </ButtonLink>
          </div>
        </div>
      </Panel>

      {/* Quick Access Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Scores Card */}
        <Panel className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Điểm số</h3>
          <p className="mt-2 text-sm text-slate-600">
            Xem bảng điểm của bạn theo từng môn học và học kỳ.
          </p>
          <div className="mt-4">
            <Link
              href="/my-scores"
              className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Xem điểm số →
            </Link>
          </div>
        </Panel>

        {/* Attendance Card */}
        <Panel className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Điểm danh</h3>
          <p className="mt-2 text-sm text-slate-600">
            Kiểm tra lịch sử điểm danh, vắng mặt và tình trạng học tập.
          </p>
          <div className="mt-4">
            <Link
              href="/my-attendance"
              className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Xem điểm danh →
            </Link>
          </div>
        </Panel>

        {/* Schedule Card */}
        <Panel className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Thời khóa biểu</h3>
          <p className="mt-2 text-sm text-slate-600">
            Xem lịch học, phòng học, và giáo viên hướng dẫn.
          </p>
          <div className="mt-4">
            <Link
              href="/my-schedule"
              className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Xem thời khóa biểu →
            </Link>
          </div>
        </Panel>
      </section>

      {/* Notifications */}
      <Panel className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Thông báo gần đây</h3>
        <p className="mt-2 text-sm text-slate-600">
          Bạn không có thông báo mới. Hãy kiểm tra{" "}
          <Link href="/notifications" className="font-medium text-blue-600 hover:underline">
            trang thông báo
          </Link>{" "}
          để xem tất cả.
        </p>
      </Panel>
    </div>
  );
}
