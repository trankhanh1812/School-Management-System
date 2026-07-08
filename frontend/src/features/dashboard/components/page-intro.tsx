import type { ReactNode } from "react";
import { Panel } from "@/shared/ui/panel";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

const breadcrumbLabels: Record<string, string> = {
  Attendance: "Điểm danh",
  Classes: "Lớp học",
  Conduct: "Hạnh kiểm",
  Create: "Tạo mới",
  Dashboard: "Tổng quan",
  Detail: "Chi tiết",
  Edit: "Chỉnh sửa",
  Exam: "Bài kiểm tra",
  Notifications: "Thông báo",
  Promotion: "Xét lên lớp",
  Reports: "Báo cáo",
  Schedule: "Thời khóa biểu",
  Score: "Điểm số",
  Students: "Học sinh",
  Subjects: "Môn học",
  System: "Cấu hình hệ thống",
  Teachers: "Giáo viên",
  Teaching: "Phân công giảng dạy",
  "Assign Teachers": "Phân công giáo viên",
  Timetable: "Thời khóa biểu",
  Test: "Kiểm thử",
};

function normalizeEyebrow(value: string) {
  return value
    .split("/")
    .map((part) => {
      const label = part.trim();
      return breadcrumbLabels[label] ?? label;
    })
    .filter(Boolean)
    .join(" / ");
}

export function PageIntro({ eyebrow, title, actions }: PageIntroProps) {
  const normalizedEyebrow = normalizeEyebrow(eyebrow);

  return (
    <Panel className="overflow-hidden border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-l-4 border-sky-500 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
            {normalizedEyebrow}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>
        ) : null}
      </div>
    </Panel>
  );
}
