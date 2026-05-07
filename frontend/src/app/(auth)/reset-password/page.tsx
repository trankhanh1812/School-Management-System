import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Đặt lại mật khẩu"
      title="Cập nhật mật khẩu bằng mã xác nhận"
      description="Nhập mã khôi phục và mật khẩu mới để quay lại hệ thống với phiên đăng nhập an toàn."
    >
      <AuthCard
        title="Đặt lại mật khẩu"
        description="Nhập mã xác nhận và mật khẩu mới. Sau khi thành công, hệ thống sẽ đưa bạn về trang đăng nhập."
        footer={
          <p>
            Muốn đăng nhập ngay?{" "}
            <Link href="/login" className="font-semibold text-cyan-700">
              Mở trang đăng nhập
            </Link>
          </p>
        }
      >
        <Suspense fallback={<div className="text-sm text-slate-500">Đang tải biểu mẫu...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
