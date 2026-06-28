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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const usernameIsValid = username.trim().length > 0;
  const passwordIsValid = password.length >= authValidation.passwordMinLength;

  const usernameError =
    submitted && !usernameIsValid ? "Vui lòng nhập tên người dùng." : undefined;

  const passwordError =
    submitted && !passwordIsValid
      ? !password
        ? "Vui lòng nhập mật khẩu."
        : `Mật khẩu phải có ít nhất ${authValidation.passwordMinLength} ký tự.`
      : undefined;

  const canSubmit = useMemo(
    () => usernameIsValid && passwordIsValid,
    [usernameIsValid, passwordIsValid],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitted(true);

    if (!usernameIsValid || !passwordIsValid) return;

    setIsSubmitting(true);

    try {
      const response = await authService.login({
        username: username.trim(),
        password,
      });
      signIn(response.data, rememberMe);

      // Nếu tài khoản yêu cầu đổi mật khẩu lần đầu → redirect bắt buộc
      if (response.data.user.forcePasswordChange) {
        router.replace("/change-password-first-login");
        return;
      }

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
        id="username"
        label="Tên người dùng"
        type="text"
        placeholder="CCCD, số điện thoại hoặc mã học sinh"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        error={usernameError}
        autoComplete="username"
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
        autoComplete="current-password"
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

      <Button
        type="submit"
        className="mt-2 h-12"
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
