"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { conductApi, type ConductRecord } from "@/features/conduct/api";
import { Button } from "@/shared/ui/button";
import { FormInput, FormSelect, FormTextarea } from "@/shared/ui/form-field";
import { Panel } from "@/shared/ui/panel";
import { useToast } from "@/shared/components/toast-provider";

type ConductFormMode = "create" | "edit";

export function ConductForm({ mode, conduct }: { mode: ConductFormMode; conduct?: ConductRecord }) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    studentCode: conduct?.studentCode ?? "",
    semesterCode: conduct?.semesterCode ?? "",
    classCode: conduct?.classCode ?? "",
    conductLevel: conduct?.conductLevel ?? "Tốt",
    remarks: conduct?.remarks ?? "",
    assessedByTeacherCode: conduct?.assessedByTeacherCode ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.studentCode.trim() || !form.semesterCode.trim() || !form.classCode.trim() || !form.conductLevel.trim() || !form.assessedByTeacherCode.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin hạnh kiểm.");
      showToast("Vui lòng nhập đầy đủ thông tin hạnh kiểm.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        studentCode: form.studentCode.trim().toUpperCase(),
        semesterCode: form.semesterCode.trim().toUpperCase(),
        classCode: form.classCode.trim().toUpperCase(),
        conductLevel: form.conductLevel.trim(),
        remarks: form.remarks.trim() || undefined,
        assessedByTeacherCode: form.assessedByTeacherCode.trim().toUpperCase(),
      };

      if (isEdit && conduct?.id) {
        await conductApi.update(conduct.id, payload);
        showToast("Cập nhật hạnh kiểm thành công.", "success");
      } else {
        await conductApi.create(payload);
        showToast("Tạo hạnh kiểm thành công.", "success");
      }
      router.push("/students/conduct");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể lưu hạnh kiểm.";
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
            label="Mã học sinh"
            value={form.studentCode}
            onChange={(event) => setForm((prev) => ({ ...prev, studentCode: event.target.value.toUpperCase() }))}
          />
          <FormInput
            label="Mã học kỳ"
            value={form.semesterCode}
            onChange={(event) => setForm((prev) => ({ ...prev, semesterCode: event.target.value.toUpperCase() }))}
          />
          <FormInput
            label="Mã lớp"
            value={form.classCode}
            onChange={(event) => setForm((prev) => ({ ...prev, classCode: event.target.value.toUpperCase() }))}
          />
          <FormInput
            label="Mã giáo viên đánh giá"
            value={form.assessedByTeacherCode}
            onChange={(event) => setForm((prev) => ({ ...prev, assessedByTeacherCode: event.target.value.toUpperCase() }))}
          />
          <FormSelect
            label="Hạnh kiểm"
            value={form.conductLevel}
            onChange={(event) => setForm((prev) => ({ ...prev, conductLevel: event.target.value }))}
          >
            <option value="Tốt">Tốt</option>
            <option value="Khá">Khá</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Yếu">Yếu</option>
          </FormSelect>
          <FormTextarea
            label="Ghi chú"
            value={form.remarks}
            onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
            className="md:col-span-2"
            rows={4}
          />
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-5" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo hạnh kiểm"}
        </Button>
      </div>
    </form>
  );
}
