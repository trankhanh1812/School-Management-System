"use client";

import { useCallback, useState } from "react";
import { attendanceApi } from "@/features/attendance/api";
import { useQRScanner } from "@/features/attendance/use-qr-scanner";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useMyStudentProfileData } from "@/features/student/student-client-data";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

type ScanResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function QRScanContent() {
  const { student, isLoading: profileLoading } = useMyStudentProfileData();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDetected = useCallback(
    async (qrData: string) => {
      if (!student?.studentCode) {
        setResult({
          status: "error",
          message: "Không tìm thấy mã học sinh. Vui lòng liên hệ quản trị viên.",
        });
        return;
      }

      setSubmitting(true);
      setResult(null);

      try {
        await attendanceApi.recordQR(student.studentCode, qrData);
        setResult({
          status: "success",
          message: "Điểm danh thành công! Hệ thống đã ghi nhận sự có mặt của bạn.",
        });
      } catch (err) {
        const raw = err instanceof Error ? err.message : "";

        // Map common backend error messages to Vietnamese
        let message = "Điểm danh thất bại. Vui lòng thử lại.";
        if (raw.includes("expired") || raw.includes("hết hạn")) {
          message = "Mã QR đã hết hạn. Vui lòng yêu cầu giáo viên tạo mã mới.";
        } else if (raw.includes("already") || raw.includes("đã điểm danh")) {
          message = "Bạn đã điểm danh cho buổi học này rồi.";
        } else if (raw.includes("IP") || raw.includes("network") || raw.includes("mạng")) {
          message =
            "Yêu cầu không hợp lệ. Bạn phải kết nối mạng nội bộ của trường để điểm danh QR.";
        } else if (raw) {
          message = raw;
        }

        setResult({ status: "error", message });
      } finally {
        setSubmitting(false);
      }
    },
    [student?.studentCode],
  );

  const { state, errorMessage, videoRef, canvasRef, start, stop } = useQRScanner({
    onDetected: (qrData) => void handleDetected(qrData),
  });

  const handleReset = () => {
    setResult(null);
  };

  if (profileLoading) {
    return <div className="text-sm text-slate-500">Đang tải thông tin học sinh...</div>;
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Điểm danh"
        title="Quét mã QR điểm danh"
        description="Kết nối WiFi trường và quét mã QR do giáo viên hiển thị trên bảng để điểm danh."
      />

      {/* Student info */}
      {student && (
        <Panel className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
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

      {/* Result state */}
      {result && (
        <Panel
          className={`p-5 ${
            result.status === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {result.status === "success" ? "✅" : "❌"}
            </span>
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  result.status === "success" ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.status === "success" ? "Điểm danh thành công" : "Điểm danh thất bại"}
              </p>
              <p
                className={`mt-1 text-sm ${
                  result.status === "success" ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
          {result.status === "error" && (
            <div className="mt-4">
              <Button onClick={handleReset} tone="secondary" className="w-full sm:w-auto">
                Thử lại
              </Button>
            </div>
          )}
        </Panel>
      )}

      {/* Scanner area — only show when no final result */}
      {!result && (
        <Panel className="overflow-hidden p-0">
          {/* Camera viewport */}
          <div className="relative aspect-square w-full max-w-sm mx-auto bg-black">
            {/* Hidden canvas for frame processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Video feed */}
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />

            {/* Overlay when not scanning */}
            {state !== "scanning" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                {state === "idle" && (
                  <p className="text-sm text-slate-300">Camera chưa bật</p>
                )}
                {state === "requesting" && (
                  <p className="text-sm text-slate-300">Đang xin quyền camera...</p>
                )}
                {state === "error" && (
                  <p className="max-w-[200px] text-center text-sm text-red-300">
                    {errorMessage}
                  </p>
                )}
              </div>
            )}

            {/* Scanning frame guide */}
            {state === "scanning" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            )}

            {/* Submitting overlay */}
            {submitting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-sm text-white">Đang gửi điểm danh...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4">
            {state === "idle" || state === "error" ? (
              <Button onClick={() => void start()} className="w-full">
                {state === "error" ? "Thử lại" : "Bật camera và quét QR"}
              </Button>
            ) : state === "scanning" ? (
              <Button onClick={stop} tone="secondary" className="w-full">
                Dừng quét
              </Button>
            ) : state === "requesting" ? (
              <Button disabled className="w-full">
                Đang xin quyền camera...
              </Button>
            ) : null}
          </div>
        </Panel>
      )}

      {/* Instructions */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Hướng dẫn điểm danh QR:</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Kết nối điện thoại vào WiFi của trường.</li>
          <li>Nhấn &quot;Bật camera và quét QR&quot; và cấp quyền camera.</li>
          <li>Hướng camera vào mã QR giáo viên hiển thị trên bảng.</li>
          <li>Hệ thống tự động ghi nhận khi quét thành công.</li>
        </ol>
        <p className="mt-3 text-xs text-blue-700">
          Lưu ý: Mã QR có hiệu lực trong 15 phút. Mỗi buổi học chỉ điểm danh được 1 lần.
        </p>
      </div>
    </div>
  );
}
