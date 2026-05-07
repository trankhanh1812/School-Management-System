import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Đăng nhập và phân quyền"
      title="Đăng nhập vào hệ thống SMS"
      description="Truy cập nhanh vào đúng khu vực làm việc sau khi hệ thống xác thực tài khoản của bạn."
    >
      <AuthCard
        title="Chào mừng quay lại"
        description="Nhập thông tin để tiếp tục theo dõi học vụ, lớp học và các tác vụ đã được phân quyền."
        footer={
          <p>
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-semibold text-cyan-700">
              Tạo tài khoản mới
            </Link>
          </p>
        }
      >
        <Suspense fallback={<div className="text-sm text-slate-500">Đang tải biểu mẫu...</div>}>
          <LoginForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
