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

type ParentEntry = {
  fullName: string;
  phone: string;
  email: string;
  relation: string;
  isPrimaryContact: boolean;
};

type StudentFormProps = {
  mode: "create" | "edit";
  student?: StudentRecord;
};

function normalizeAcademicYear(value: string) {
  return value.trim().replace(/\s*-\s*/g, "-");
}

const EMPTY_PARENT: ParentEntry = {
  fullName: "",
  phone: "",
  email: "",
  relation: "guardian",
  isPrimaryContact: false,
};

export function StudentForm({ mode, student }: StudentFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = mode === "edit";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Parent entries state
  const [parents, setParents] = useState<ParentEntry[]>(() => {
    if (student?.parents && student.parents.length > 0) {
      return student.parents.map((p) => ({
        fullName: p.fullName ?? "",
        phone: p.phone ?? "",
        email: p.email ?? "",
        relation: "guardian",
        isPrimaryContact: p.role === "Lien he chinh",
      }));
    }
    return [];
  });

  function addParent() {
    setParents((prev) => [...prev, { ...EMPTY_PARENT }]);
  }

  function removeParent(idx: number) {
    setParents((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateParent(idx: number, field: keyof ParentEntry, value: string | boolean) {
    setParents((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    const payload: StudentUpsertPayload = {
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
      nationalId: String(formData.get("nationalId") ?? "").trim() || undefined,
      parents: parents
        .filter((p) => p.fullName.trim() || p.phone.trim())
        .map((p) => ({
          fullName: p.fullName.trim() || undefined,
          phone: p.phone.trim() || undefined,
          email: p.email.trim() || undefined,
          relation: p.relation,
          isPrimaryContact: p.isPrimaryContact,
        })),
    };

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

      {/* ── Thông tin cá nhân ── */}
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Thông tin cá nhân</h3>
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
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
            <TextField
              id="nationalId"
              name="nationalId"
              label="Số CCCD / CMND"
              defaultValue={(student as any)?.nationalId ?? ""}
              placeholder="012345678901"
              hint="Dùng làm username đăng nhập. Nếu để trống, dùng mã học sinh."
            />
          </div>
        </div>
      </Panel>

      {/* ── Thông tin liên hệ ── */}
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Thông tin liên hệ</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Phục vụ quản lý liên lạc và đồng bộ tài khoản học sinh.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField id="phone" name="phone" label="Số điện thoại" defaultValue={student?.phone} placeholder="0901234567" />
            <TextField id="email" name="email" label="Email học sinh" defaultValue={student?.email} placeholder="student@sms.edu.vn" />
          </div>
          <TextField id="address" name="address" label="Địa chỉ" defaultValue={student?.address} placeholder="Nhập địa chỉ hiện tại" />
        </div>
      </Panel>

      {/* ── Thông tin học tập ── */}
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-5">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Thông tin học tập</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Các trường này sẽ map vào student, student-class và năm học hiện hành.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormSelect id="academicYear" name="academicYear" label="Năm học" defaultValue={student?.academicYear ?? "2026 - 2027"}>
              {(["2026 - 2027", "2025 - 2026", "2024 - 2025"] as const).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
            <FormSelect id="className" name="className" label="Lớp hiện tại" defaultValue={student?.className ?? "10A1"}>
              {(["10A1", "10A2", "11A1", "11A2", "12A1"] as const).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
            <FormSelect id="status" name="status" label="Trạng thái" defaultValue={student?.status ?? "ACTIVE"}>
              {(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"] as const).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
            <FormSelect id="conduct" name="conduct" label="Hạnh kiểm" defaultValue={student?.conduct ?? "Tốt"}>
              {(["Tốt", "Khá", "Trung bình", "Yếu"] as const).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
          </div>
        </div>
      </Panel>

      {/* ── Phụ huynh / Người giám hộ ── */}
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">Phụ huynh / Người giám hộ</h3>
              <p className="mt-1 text-sm text-slate-600">
                Nếu có số điện thoại, hệ thống sẽ tự động tạo tài khoản phụ huynh
                (username = phone, mật khẩu tạm = phone, bắt buộc đổi lần đầu đăng nhập).
              </p>
            </div>
            <Button type="button" tone="secondary" onClick={addParent} className="shrink-0">
              + Thêm phụ huynh
            </Button>
          </div>

          {parents.length === 0 && (
            <p className="text-sm text-slate-500">Chưa có phụ huynh nào. Nhấn "+ Thêm phụ huynh" để thêm.</p>
          )}

          {parents.map((parent, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 p-4 grid gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Phụ huynh {idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeParent(idx)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Xóa
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                  <input
                    value={parent.fullName}
                    onChange={(e) => updateParent(idx, "fullName", e.target.value)}
                    placeholder="Nguyễn Thị B"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-slate-700">
                    Số điện thoại <span className="text-slate-400">(dùng làm username)</span>
                  </label>
                  <input
                    value={parent.phone}
                    onChange={(e) => updateParent(idx, "phone", e.target.value)}
                    placeholder="0901234567"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    value={parent.email}
                    onChange={(e) => updateParent(idx, "email", e.target.value)}
                    placeholder="parent@email.com"
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-slate-700">Quan hệ</label>
                  <select
                    value={parent.relation}
                    onChange={(e) => updateParent(idx, "relation", e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  >
                    <option value="father">Bố</option>
                    <option value="mother">Mẹ</option>
                    <option value="guardian">Người giám hộ</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={parent.isPrimaryContact}
                  onChange={(e) => updateParent(idx, "isPrimaryContact", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Là người liên hệ chính
              </label>
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-12 px-6" disabled={isSubmitting}>
          {isSubmitting
            ? isEdit ? "Đang lưu..." : "Đang tạo..."
            : isEdit ? "Lưu thay đổi" : "Tạo học sinh"}
        </Button>
        <Button type="button" tone="secondary" className="h-12 px-6" disabled>
          Lưu tạm
        </Button>
      </div>
    </form>
  );
}
