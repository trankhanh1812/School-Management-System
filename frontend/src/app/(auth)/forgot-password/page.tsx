import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Khôi phục mật khẩu"
      title="Lấy lại quyền truy cập tài khoản"
      description="Gửi yêu cầu đặt lại mật khẩu để tiếp tục sử dụng hệ thống một cách an toàn."
    >
      <AuthCard
        title="Quên mật khẩu"
        description="Nhập email đã đăng ký để hệ thống gửi hướng dẫn đặt lại mật khẩu nếu tài khoản hợp lệ."
        footer={
          <p>
            Nhớ mật khẩu rồi?{" "}
            <Link href="/login" className="font-semibold text-cyan-700">
              Quay lại đăng nhập
            </Link>
          </p>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthShell>
  );
}
