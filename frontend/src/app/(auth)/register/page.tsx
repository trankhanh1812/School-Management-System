import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Tài khoản và truy cập"
      title="Bắt đầu cùng hệ thống quản lý trường học"
      description="Tạo tài khoản để truy cập không gian dành cho giáo viên, học sinh và phụ huynh."
    >
      <AuthCard
        title="Đăng ký tài khoản"
        description="Điền thông tin cần thiết để tạo tài khoản và bắt đầu sử dụng hệ thống."
        footer={
          <p>
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-cyan-700">
              Quay lại đăng nhập
            </Link>
          </p>
        }
      >
        <RegisterForm />
      </AuthCard>
    </AuthShell>
  );
}
