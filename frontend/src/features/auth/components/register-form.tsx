"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthStatus } from "@/features/auth/components/auth-status";
import { authValidation } from "@/features/auth/schemas";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authService } from "@/services/auth.service";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";

type RegisterRole = "TEACHER" | "STUDENT" | "PARENT";

const roleOptions: { value: RegisterRole; label: string }[] = [
  { value: "TEACHER", label: "Giáo viên" },
  { value: "STUDENT", label: "Học sinh" },
  { value: "PARENT", label: "Phụ huynh" },
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  if (!value.trim()) {
    return true;
  }

  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 11;
}

export function RegisterForm() {
  const router = useRouter();
  const { signIn } = useAuthSession();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RegisterRole>("TEACHER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailIsValid = isValidEmail(email);
  const phoneIsValid = isValidPhone(phone);
  const passwordIsValid = password.length >= authValidation.passwordMinLength;
  const passwordMatched = password === confirmPassword && confirmPassword.length > 0;
  const fullNameError =
    submitted || fullName.length > 0
      ? !fullName.trim()
        ? "Vui lòng nhập họ và tên."
        : undefined
      : undefined;
  const emailError =
    submitted || email.length > 0
      ? !email.trim()
        ? "Vui lòng nhập email."
        : !emailIsValid
          ? "Email chưa đúng định dạng."
          : undefined
      : undefined;
  const phoneError =
    submitted || phone.length > 0
      ? !phoneIsValid
        ? "Số điện thoại cần có từ 9 đến 11 chữ số."
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
  const confirmPasswordError =
    submitted || confirmPassword.length > 0
      ? !confirmPassword
        ? "Vui lòng xác nhận mật khẩu."
        : !passwordMatched
          ? "Mật khẩu xác nhận chưa khớp."
          : undefined
      : undefined;
  const acceptedError =
    submitted && !accepted
      ? "Bạn cần đồng ý với điều khoản sử dụng và chính sách bảo mật."
      : undefined;

  const canSubmit = useMemo(
    () =>
      fullName.trim().length > 0 &&
      emailIsValid &&
      phoneIsValid &&
      passwordIsValid &&
      passwordMatched &&
      accepted,
    [accepted, emailIsValid, fullName, passwordIsValid, passwordMatched, phoneIsValid],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitted(true);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    if (!emailIsValid) {
      setError("Email chưa đúng định dạng.");
      return;
    }

    if (!phoneIsValid) {
      setError("Số điện thoại không hợp lệ.");
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

    if (!accepted) {
      setError("Bạn cần đồng ý với điều khoản sử dụng và chính sách bảo mật.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
      });
      signIn(response.data);
      router.replace("/dashboard");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Tạo tài khoản thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <AuthStatus tone="error" message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="fullName"
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={fullNameError}
          required
        />
        <label className="grid gap-2 text-sm text-slate-700" htmlFor="registerRole">
          <span className="font-medium">Vai trò</span>
          <select
            id="registerRole"
            value={role}
            onChange={(event) => setRole(event.target.value as RegisterRole)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <TextField
          id="registerEmail"
          label="Email"
          type="email"
          placeholder="teacher@sms.edu.vn"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
          required
        />
        <TextField
          id="phone"
          label="Số điện thoại"
          placeholder="0901234567"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={phoneError}
          hint="Không bắt buộc"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="registerPassword"
          label="Mật khẩu"
          type="password"
          placeholder="Tạo mật khẩu"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
          required
        />
        <TextField
          id="confirmPassword"
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmPasswordError}
          required
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của hệ thống.</span>
        </label>

        <div className="mt-3 grid gap-2 pl-7">
          <details className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-cyan-700">
              Xem điều khoản sử dụng
            </summary>
            <div className="mt-3 text-sm leading-6 text-slate-600">
              Tài khoản chỉ được sử dụng cho mục đích học tập, giảng dạy và theo dõi
              thông tin trong phạm vi được cấp quyền.
            </div>
          </details>

          <details className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-cyan-700">
              Xem chính sách bảo mật
            </summary>
            <div className="mt-3 text-sm leading-6 text-slate-600">
              Hệ thống lưu thông tin tài khoản, lịch sử truy cập và dữ liệu học vụ để
              phục vụ vận hành, không chia sẻ ra ngoài nếu không có phê duyệt.
            </div>
          </details>
        </div>
        {acceptedError ? <p className="mt-3 text-xs text-rose-600">{acceptedError}</p> : null}
      </div>

      {!canSubmit ? (
        <p className="text-xs text-slate-500">
          Hoàn tất các trường bắt buộc và đồng ý điều khoản để mở nút tạo tài khoản.
        </p>
      ) : null}
      <Button type="submit" className="mt-2 h-12" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </Button>
    </form>
  );
}
