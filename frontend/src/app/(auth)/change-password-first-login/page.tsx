"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

export default function ChangePasswordFirstLoginPage() {
  const router = useRouter();
  const { session, signIn } = useAuthSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Redirect trong useEffect, không trong render
  useEffect(() => {
    if (session && !session.user.forcePasswordChange) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const passwordError =
    submitted && newPassword.length < 6
      ? "Mật khẩu mới phải có ít nhất 6 ký tự."
      : undefined;

  const confirmError =
    submitted && newPassword !== confirmPassword
      ? "Mật khẩu xác nhận không khớp."
      : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    if (newPassword.length < 6) return;
    if (newPassword !== confirmPassword) return;

    setIsSubmitting(true);
    try {
      await authService.changePasswordFirstLogin(newPassword);

      // Cập nhật session — tắt flag forcePasswordChange
      if (session) {
        signIn(
          {
            ...session,
            user: { ...session.user, forcePasswordChange: false },
          },
          true,
        );
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể đổi mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        {/* Logo */}
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 font-mono text-base font-bold text-white">
          SMS
        </div>

        <h1 className="text-xl font-bold text-slate-900">Đổi mật khẩu lần đầu</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tài khoản của bạn đang dùng mật khẩu tạm thời. Vui lòng đặt mật khẩu mới trước khi tiếp tục.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <TextField
            id="new-password"
            label="Mật khẩu mới"
            type="password"
            placeholder="Ít nhất 6 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordError}
            required
          />

          <TextField
            id="confirm-password"
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmError}
            required
          />

          <Button
            type="submit"
            className="mt-2 h-12"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Xác nhận đổi mật khẩu"}
          </Button>
        </form>

        <p className="mt-4 text-xs text-slate-500 text-center">
          Sau khi đổi mật khẩu thành công, bạn sẽ được chuyển vào hệ thống.
        </p>
      </div>
    </div>
  );
}
