"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { attendanceApi } from "@/features/attendance/api";
import { readAuthSession } from "@/lib/auth/auth-session";
import { env } from "@/lib/env";

type PageState =
  | { status: "loading" }
  | { status: "success"; subjectName: string; className: string }
  | { status: "error"; message: string }
  | { status: "unauthenticated" };

function AttendContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "Liên kết không hợp lệ. Vui lòng quét lại mã QR." });
      return;
    }

    const session = readAuthSession();
    if (!session) {
      // Not logged in — redirect to login, come back after
      const returnUrl = encodeURIComponent(`/attend?token=${token}`);
      router.replace(`/login?redirect=${returnUrl}`);
      return;
    }

    // Logged in — confirm attendance
    const confirm = async () => {
      try {
        const res = await attendanceApi.confirmQRToken(token);
        const data = res.data;
        setState({
          status: "success",
          subjectName: data?.subjectName ?? "—",
          className: data?.className ?? "—",
        });
      } catch (err) {
        const raw = err instanceof Error ? err.message : "";
        let message = "Điểm danh thất bại. Vui lòng thử lại.";
        if (raw.includes("expired") || raw.includes("hết hạn")) {
          message = "Mã QR đã hết hạn. Vui lòng yêu cầu giáo viên tạo mã mới.";
        } else if (raw.includes("already") || raw.includes("đã điểm danh")) {
          message = "Bạn đã điểm danh cho buổi học này rồi.";
        } else if (raw.includes("IP") || raw.includes("network") || raw.includes("mạng")) {
          message = "Yêu cầu không hợp lệ. Bạn phải kết nối mạng nội bộ của trường để điểm danh QR.";
        } else if (raw) {
          message = raw;
        }
        setState({ status: "error", message });
      }
    };

    void confirm();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-lg text-center">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 font-mono text-lg font-bold text-white">
          SMS
        </div>

        {state.status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
            <p className="text-base font-semibold text-slate-800">Đang xác nhận điểm danh...</p>
            <p className="mt-2 text-sm text-slate-500">Vui lòng chờ trong giây lát.</p>
          </>
        )}

        {state.status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl">
              ✅
            </div>
            <p className="text-xl font-bold text-green-800">Điểm danh thành công!</p>
            <p className="mt-2 text-sm text-slate-600">
              Hệ thống đã ghi nhận sự có mặt của bạn.
            </p>
            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Môn học</span>
                <span className="font-semibold text-slate-900">{state.subjectName}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-slate-500">Lớp</span>
                <span className="font-semibold text-slate-900">{state.className}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/my-attendance")}
              className="mt-6 w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Xem lịch sử điểm danh
            </button>
          </>
        )}

        {state.status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-4xl">
              ❌
            </div>
            <p className="text-xl font-bold text-red-800">Điểm danh thất bại</p>
            <p className="mt-2 text-sm text-red-600">{state.message}</p>
            <button
              type="button"
              onClick={() => router.push("/my-attendance")}
              className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay về trang điểm danh
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AttendPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        </div>
      }
    >
      <AttendContent />
    </Suspense>
  );
}
