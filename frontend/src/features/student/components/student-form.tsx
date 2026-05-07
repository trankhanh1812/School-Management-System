"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthStatus } from "@/features/auth/components/auth-status";
import { studentApi, type StudentUpsertPayload } from "@/features/student/api";
import type { StudentRecord } from "@/features/student/student-data";
import { Button } from "@/shared/ui/button";
import { FormSelect } from "@/shared/ui/form-field";
import { Panel } from "@/shared/ui/panel";
import { TextField } from "@/shared/ui/text-field";
import { useToast } from "@/shared/components/toast-provider";

type StudentFormProps = {
  mode: "create" | "edit";
  student?: StudentRecord;
};

function normalizeAcademicYear(value: string) {
  return value.trim().replace(/\s*-\s*/g, "-");
}

function toPayload(formData: FormData): StudentUpsertPayload {
  return {
    studentCode: String(formData.get("studentCode") ?? "").trim().toUpperCase(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    dateOfBirth: String(formData.get("dateOfBirth") ?? "").trim(),
    gender: String(formData.get("gender") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    address: String(formData.get("address") ?? "").trim(),
    academicYear: normalizeAcademicYear(String(formData.get("academicYear") ?? "")),
    className: String(formData.get("className") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    conduct: String(formData.get("conduct") ?? "").trim(),
  };
}

export function StudentForm({ mode, student }: StudentFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = mode === "edit";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const payload = toPayload(formData);

    if (!payload.studentCode || !payload.fullName || !payload.academicYear || !payload.className) {
      setError("Vui lòng nhập đầy đủ mã học sinh, họ tên, năm học và lớp.");
      showToast("Vui lòng nhập đầy đủ thông tin bắt buộc.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && student?.studentCode) {
        const response = await studentApi.update(student.studentCode, payload);
        setSuccess("Cập nhật hồ sơ học sinh thành công.");
        showToast("Cập nhật hồ sơ học sinh thành công.", "success");
        router.replace(`/students/${response.data.studentCode}`);
      } else {
        const response = await studentApi.create(payload);
        setSuccess("Tạo hồ sơ học sinh thành công.");
        showToast("Tạo hồ sơ học sinh thành công.", "success");
        router.replace(`/students/${response.data.studentCode}`);
      }
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Không thể lưu hồ sơ học sinh.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <AuthStatus tone="error" message={error} /> : null}
      {success ? <AuthStatus tone="success" message={success} /> : null}

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
              Thông tin cá nhân
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Dùng cho hồ sơ chuẩn, thẻ học sinh và học bạ điện tử.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              id="studentCode"
              name="studentCode"
              label="Mã học sinh"
              defaultValue={student?.studentCode}
              placeholder="HS13001"
              required
            />
            <TextField
              id="fullName"
              name="fullName"
              label="Họ và tên"
              defaultValue={student?.fullName}
              placeholder="Nguyễn Văn A"
              required
            />
            <TextField
              id="dateOfBirth"
              name="dateOfBirth"
              label="Ngày sinh"
              defaultValue={student?.dateOfBirth}
              placeholder="01/01/2010 hoặc 2010-01-01"
            />
            <FormSelect id="gender" name="gender" label="Giới tính" defaultValue={student?.gender ?? "Nam"}>
              {(["Nam", "Nữ", "Khác"] as const).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
              Thông tin liên hệ
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Phục vụ quản lý liên lạc và đồng bộ tài khoản học sinh.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              id="phone"
              name="phone"
              label="Số điện thoại"
              defaultValue={student?.phone}
              placeholder="0901234567"
            />
            <TextField
              id="email"
              name="email"
              label="Email học sinh"
              defaultValue={student?.email}
              placeholder="student@sms.edu.vn"
            />
          </div>

          <TextField
            id="address"
            name="address"
            label="Địa chỉ"
            defaultValue={student?.address}
            placeholder="Nhập địa chỉ hiện tại"
          />
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <div className="grid gap-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
              Thông tin học tập
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Các trường này sẽ map vào student, student-class và năm học hiện hành.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormSelect id="academicYear" name="academicYear" label="Năm học" defaultValue={student?.academicYear ?? "2026 - 2027"}>
              {(["2026 - 2027", "2025 - 2026", "2024 - 2025"] as const).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
            <FormSelect id="className" name="className" label="Lớp hiện tại" defaultValue={student?.className ?? "10A1"}>
              {(["10A1", "10A2", "11A1", "11A2", "12A1"] as const).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
            <FormSelect id="status" name="status" label="Trạng thái" defaultValue={student?.status ?? "ACTIVE"}>
              {(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"] as const).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
            <FormSelect id="conduct" name="conduct" label="Hạnh kiểm" defaultValue={student?.conduct ?? "Tốt"}>
              {(["Tốt", "Khá", "Trung bình", "Yếu"] as const).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-12 px-6" disabled={isSubmitting}>
          {isSubmitting
            ? isEdit
              ? "Đang lưu..."
              : "Đang tạo..."
            : isEdit
              ? "Lưu thay đổi"
              : "Tạo học sinh"}
        </Button>
        <Button type="button" tone="secondary" className="h-12 px-6" disabled>
          Lưu tạm
        </Button>
      </div>
    </form>
  );
}
