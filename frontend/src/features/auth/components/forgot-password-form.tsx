"use client";

import { useState } from "react";
import { AuthStatus } from "@/features/auth/components/auth-status";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const identifierError =
    submitted && !identifier.trim() ? "Vui lòng nhập email tài khoản." : undefined;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setTokenPreview("");
    setSubmitted(true);

    if (!identifier.trim()) return;

    setIsSubmitting(true);

    try {
      // Backend vẫn nhận email để tìm user — truyền identifier (có thể là email)
      const response = await authService.forgotPassword(identifier.trim());
      setTokenPreview(response.data?.token ?? "");
      setSuccess("Nếu tài khoản hợp lệ, hệ thống đã tạo mã khôi phục.");
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
          message={`Mã khôi phục (dev): ${tokenPreview} — dùng mã này ở màn hình đặt lại mật khẩu.`}
        />
      ) : null}

      <TextField
        id="forgotIdentifier"
        label="Email tài khoản"
        type="text"
        placeholder="email@sms.edu.vn"
        hint="Nhập email đã đăng ký với tài khoản của bạn."
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        error={identifierError}
        required
      />

      <Button
        type="submit"
        className="mt-2 h-12"
        disabled={!identifier.trim() || isSubmitting}
      >
        {isSubmitting ? "Đang gửi yêu cầu..." : "Tạo mã khôi phục"}
      </Button>
    </form>
  );
}
