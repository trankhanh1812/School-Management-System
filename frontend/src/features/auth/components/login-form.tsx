"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthStatus } from "@/features/auth/components/auth-status";
import { authValidation } from "@/features/auth/schemas";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailIsValid = isValidEmail(email);
  const passwordIsValid = password.length >= authValidation.passwordMinLength;
  const emailError =
    submitted || email.length > 0
      ? !email.trim()
        ? "Vui lòng nhập email."
        : !emailIsValid
          ? "Email chưa đúng định dạng."
          : undefined
      : undefined;
  const passwordError =
    submitted || password.length > 0
      ? !password
        ? "Vui lòng nhập mật khẩu."
        : !passwordIsValid
          ? `Mật khẩu phải có ít nhất ${authValidation.passwordMinLength} ký tự.`
          : undefined
      : undefined;
  const canSubmit = useMemo(
    () => emailIsValid && passwordIsValid,
    [emailIsValid, passwordIsValid],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitted(true);

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (!emailIsValid) {
      setError("Email chưa đúng định dạng.");
      return;
    }

    if (!passwordIsValid) {
      setError(
        `Mật khẩu phải có ít nhất ${authValidation.passwordMinLength} ký tự.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });
      signIn(response.data, rememberMe);

      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      router.replace(redirectTo);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <AuthStatus tone="error" message={error} /> : null}
      <TextField
        id="email"
        label="Email"
        type="email"
        placeholder="admin@sms.edu.vn"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={emailError}
        required
      />
      <TextField
        id="password"
        label="Mật khẩu"
        type="password"
        placeholder="Nhập mật khẩu"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={passwordError}
        required
      />
      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Ghi nhớ đăng nhập
        </label>
        <Link href="/forgot-password" className="font-semibold text-cyan-700">
          Quên mật khẩu?
        </Link>
      </div>
      {!canSubmit ? (
        <p className="text-xs text-slate-500">
          Điền đúng email và mật khẩu hợp lệ để mở nút đăng nhập.
        </p>
      ) : null}
      <Button
        type="submit"
        className="mt-2 h-12"
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
      <Button type="button" tone="secondary" className="h-12" disabled>
        Đăng nhập với Google
      </Button>
    </form>
  );
}
