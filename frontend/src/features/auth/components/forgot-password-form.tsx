"use client";

import { useMemo, useState } from "react";
import { AuthStatus } from "@/features/auth/components/auth-status";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailIsValid = isValidEmail(email);
  const emailError =
    submitted || email.length > 0
      ? !email.trim()
        ? "Vui lòng nhập email tài khoản."
        : !emailIsValid
          ? "Email chưa đúng định dạng."
          : undefined
      : undefined;
  const canSubmit = useMemo(() => emailIsValid, [emailIsValid]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setTokenPreview("");
    setSubmitted(true);

    if (!email.trim()) {
      setError("Vui lòng nhập email tài khoản.");
      return;
    }

    if (!emailIsValid) {
      setError("Email chưa đúng định dạng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      setTokenPreview(response.data?.token ?? "");
      setSuccess("Nếu tài khoản hợp lệ, hệ thống đã tạo mã khôi phục để bạn đặt lại mật khẩu.");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Không thể gửi yêu cầu khôi phục mật khẩu.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <AuthStatus tone="error" message={error} /> : null}
      {success ? <AuthStatus tone="success" message={success} /> : null}
      {tokenPreview ? (
        <AuthStatus
          tone="info"
          message={`Mã khôi phục thử nghiệm: ${tokenPreview}. Bạn có thể dùng mã này ở màn hình đặt lại mật khẩu.`}
        />
      ) : null}
      <TextField
        id="forgotEmail"
        label="Email tài khoản"
        type="email"
        placeholder="student@sms.edu.vn"
        hint="Ở môi trường dev, hệ thống đang trả mã khôi phục trực tiếp để kiểm tra nhanh."
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={emailError}
        required
      />
      {!canSubmit ? (
        <p className="text-xs text-slate-500">
          Nhập email hợp lệ để gửi yêu cầu khôi phục mật khẩu.
        </p>
      ) : null}
      <Button type="submit" className="mt-2 h-12" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Đang gửi yêu cầu..." : "Tạo mã khôi phục"}
      </Button>
    </form>
  );
}
