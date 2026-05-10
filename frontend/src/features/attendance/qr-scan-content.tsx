"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useMyStudentProfileData } from "@/features/student/student-client-data";
import { env } from "@/lib/env";
import { Panel } from "@/shared/ui/panel";

/**
 * Trang này hiển thị hướng dẫn cho học sinh:
 * - QR code được tạo bởi giáo viên và hiển thị trên bảng/projector
 * - Học sinh dùng camera điện thoại (native) quét QR đó
 * - QR encode URL: {appUrl}/attend?token=<qrToken>
 * - Sau khi quét, điện thoại mở URL → trang /attend xử lý xác nhận
 *
 * Component này chỉ hiển thị hướng dẫn + demo URL flow.
 */

function QRPreview({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 220,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(() => {/* ignore */});
  }, [url]);

  return <canvas ref={canvasRef} className="rounded-xl" />;
}

export function QRScanContent() {
  const { student, isLoading } = useMyStudentProfileData();

  // Demo: build the attend URL shape so student understands what to expect
  const exampleUrl = `${env.appUrl}/attend?token=<mã-từ-giáo-viên>`;

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải thông tin học sinh...</div>;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Điểm danh QR"
        title="Hướng dẫn điểm danh bằng QR"
        description="Dùng camera điện thoại quét mã QR giáo viên hiển thị trên bảng — không cần mở app hay trình duyệt trước."
      />

      {/* Student info */}
      {student && (
        <Panel className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {student.fullName?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{student.fullName}</p>
              <p className="text-sm text-slate-500">
                {student.studentCode} · {student.className}
              </p>
            </div>
          </div>
        </Panel>
      )}

      {/* How it works */}
      <Panel className="p-5">
        <h3 className="text-base font-semibold text-slate-900">Cách thức hoạt động</h3>
        <ol className="mt-4 grid gap-4">
          {[
            {
              step: "1",
              title: "Giáo viên tạo mã QR",
              desc: "Giáo viên tạo mã QR cho buổi học và hiển thị trên bảng hoặc projector. Mã có hiệu lực 15 phút.",
              color: "bg-slate-100 text-slate-700",
            },
            {
              step: "2",
              title: "Kết nối WiFi trường",
              desc: "Đảm bảo điện thoại đang kết nối mạng nội bộ của trường. Điểm danh QR chỉ hoạt động trong mạng trường.",
              color: "bg-slate-100 text-slate-700",
            },
            {
              step: "3",
              title: "Quét mã bằng camera",
              desc: "Mở camera điện thoại (hoặc app quét mã bất kỳ), hướng vào mã QR. Điện thoại sẽ hiện thông báo mở link.",
              color: "bg-slate-100 text-slate-700",
            },
            {
              step: "4",
              title: "Xác nhận tự động",
              desc: "Nhấn mở link → hệ thống tự động ghi nhận điểm danh. Bạn sẽ thấy thông báo thành công ngay trên màn hình.",
              color: "bg-slate-100 text-slate-700",
            },
          ].map((item) => (
            <li key={item.step} className="flex items-start gap-4">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.color}`}>
                {item.step}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* Demo QR */}
      <Panel className="p-5">
        <h3 className="text-base font-semibold text-slate-900">Ví dụ mã QR điểm danh</h3>
        <p className="mt-1 text-sm text-slate-500">
          Mã QR thực tế do giáo viên tạo sẽ có dạng tương tự — quét sẽ mở link xác nhận điểm danh.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <QRPreview url={exampleUrl} />
          <p className="max-w-xs break-all text-center text-xs text-slate-400">{exampleUrl}</p>
        </div>
      </Panel>

      {/* Notes */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-medium">Lưu ý quan trọng:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Phải kết nối WiFi nội bộ của trường khi quét.</li>
          <li>Mỗi buổi học chỉ điểm danh được 1 lần.</li>
          <li>Mã QR hết hạn sau 15 phút kể từ khi giáo viên tạo.</li>
          <li>Nếu chưa đăng nhập, hệ thống sẽ yêu cầu đăng nhập trước.</li>
        </ul>
      </div>
    </div>
  );
}
