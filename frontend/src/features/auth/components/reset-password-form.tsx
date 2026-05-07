"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthStatus } from "@/features/auth/components/auth-status";
import { authValidation } from "@/features/auth/schemas";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordIsValid = password.length >= authValidation.passwordMinLength;
  const passwordMatched = password === confirmPassword && confirmPassword.length > 0;
  const tokenError =
    submitted || token.length > 0
      ? !token.trim()
        ? "Vui lòng nhập mã khôi phục."
        : undefined
      : undefined;
  const passwordError =
    submitted || password.length > 0
      ? !password
        ? "Vui lòng nhập mật khẩu mới."
        : !passwordIsValid
          ? `Mật khẩu phải có ít nhất ${authValidation.passwordMinLength} ký tự.`
          : undefined
      : undefined;
  const confirmPasswordError =
    submitted || confirmPassword.length > 0
      ? !confirmPassword
        ? "Vui lòng xác nhận mật khẩu mới."
        : !passwordMatched
          ? "Mật khẩu xác nhận chưa khớp."
          : undefined
      : undefined;
  const canSubmit = useMemo(
    () => token.trim().length > 0 && passwordIsValid && passwordMatched,
    [passwordIsValid, passwordMatched, token],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitted(true);

    if (!token.trim() || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ mã khôi phục và mật khẩu mới.");
      return;
    }

    if (!passwordIsValid) {
      setError(`Mật khẩu phải có ít nhất ${authValidation.passwordMinLength} ký tự.`);
      return;
    }

    if (!passwordMatched) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword({
        token: token.trim(),
        password,
        confirmPassword,
      });
      setSuccess("Đặt lại mật khẩu thành công. Hệ thống sẽ chuyển bạn về trang đăng nhập.");
      window.setTimeout(() => router.replace("/login"), 1000);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Không thể đặt lại mật khẩu.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <AuthStatus tone="error" message={error} /> : null}
      {success ? <AuthStatus tone="success" message={success} /> : null}
      <TextField
        id="resetToken"
        label="Mã khôi phục"
        placeholder="Dán mã từ email"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        error={tokenError}
        required
      />
      <TextField
        id="newPassword"
        label="Mật khẩu mới"
        type="password"
        placeholder="Nhập mật khẩu mới"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={passwordError}
        required
      />
      <TextField
        id="confirmNewPassword"
        label="Xác nhận mật khẩu mới"
        type="password"
        placeholder="Nhập lại mật khẩu mới"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        error={confirmPasswordError}
        required
      />
      {!canSubmit ? (
        <p className="text-xs text-slate-500">
          Điền đủ mã khôi phục và mật khẩu hợp lệ để tiếp tục.
        </p>
      ) : null}
      <Button type="submit" className="mt-2 h-12" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
      </Button>
    </form>
  );
}
