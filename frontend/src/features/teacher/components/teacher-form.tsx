"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { teacherApi } from "@/features/teacher/api";
import type { TeacherRecord } from "@/features/teacher/teacher-data";
import { Button } from "@/shared/ui/button";
import { FormInput, FormSelect } from "@/shared/ui/form-field";
import { Panel } from "@/shared/ui/panel";
import { useToast } from "@/shared/components/toast-provider";

type TeacherFormMode = "create" | "edit";

export function TeacherForm({
  mode,
  teacher,
}: {
  mode: TeacherFormMode;
  teacher?: TeacherRecord;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    teacherCode: teacher?.teacherCode ?? "",
    fullName: teacher?.fullName ?? "",
    departmentCode: "",
    phone: teacher?.phone ?? "",
    email: teacher?.email ?? "",
    status: teacher?.employmentStatus ?? "ACTIVE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.teacherCode.trim() || !form.fullName.trim()) {
      setError("Vui lòng nhập đầy đủ mã giáo viên và họ tên.");
      showToast("Vui lòng nhập đầy đủ mã giáo viên và họ tên.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        teacherCode: form.teacherCode.trim(),
        fullName: form.fullName.trim(),
        departmentCode: form.departmentCode.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        status: form.status.trim() || undefined,
      };

      if (isEdit && teacher) {
        await teacherApi.update(teacher.teacherCode, payload);
        showToast("Cập nhật hồ sơ giáo viên thành công.", "success");
        router.push(`/teachers/${payload.teacherCode}`);
      } else {
        await teacherApi.create(payload);
        showToast("Tạo hồ sơ giáo viên thành công.", "success");
        router.push(`/teachers/${payload.teacherCode}`);
      }
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể lưu hồ sơ giáo viên.";
      setError(message);
      showToast(message, "error");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Mã giáo viên"
            value={form.teacherCode}
            disabled={isEdit}
            onChange={(event) => setForm((prev) => ({ ...prev, teacherCode: event.target.value.toUpperCase() }))}
          />

          <FormInput
            label="Họ và tên"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          />

          <FormInput
            label="Mã bộ môn"
            placeholder="VD: MATH"
            value={form.departmentCode}
            onChange={(event) => setForm((prev) => ({ ...prev, departmentCode: event.target.value.toUpperCase() }))}
          />

          <FormInput
            label="Điện thoại"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          />

          <FormInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />

          <FormSelect
            label="Trạng thái"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
          </FormSelect>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-5" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo giáo viên"}
        </Button>
      </div>
    </form>
  );
}
