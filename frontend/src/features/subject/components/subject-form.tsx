"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { subjectApi } from "@/features/subject/api";
import type { SubjectRecord } from "@/features/subject/subject-data";
import { Button } from "@/shared/ui/button";
import { FormInput, FormSelect } from "@/shared/ui/form-field";
import { Panel } from "@/shared/ui/panel";
import { useToast } from "@/shared/components/toast-provider";

type SubjectFormMode = "create" | "edit";

export function SubjectForm({ mode, subject }: { mode: SubjectFormMode; subject?: SubjectRecord }) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = mode === "edit";
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  const [form, setForm] = useState({
    code: subject?.code ?? "",
    name: subject?.name ?? "",
    departmentCode: subject?.departmentCode ?? "",
    gradeLevel: subject?.gradeLevel ?? 10,
    status: subject?.status ?? "ACTIVE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDepartments() {
      setIsLoadingDepartments(true);
      try {
        const response = await subjectApi.list();
        const records = Array.isArray(response.data) ? response.data : [];
        const unique = new Map<string, string>();

        for (const item of records) {
          const code = typeof item.departmentCode === "string" ? item.departmentCode.trim() : "";
          const name = typeof item.departmentName === "string" ? item.departmentName.trim() : "";
          if (!code || !name || unique.has(code)) {
            continue;
          }
          unique.set(code, name);
        }

        if (mounted) {
          const options = Array.from(unique.entries()).map(([code, name]) => ({ code, name }));
          setDepartmentOptions(options);
        }
      } catch {
        if (mounted) {
          setDepartmentOptions([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingDepartments(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      mounted = false;
    };
  }, []);

  const mergedDepartmentOptions = useMemo(() => {
    const options = [...departmentOptions];
    const hasCurrent = options.some((item) => item.code === form.departmentCode);
    if (!hasCurrent && form.departmentCode && subject?.departmentName) {
      options.unshift({ code: form.departmentCode, name: subject.departmentName });
    }
    return options;
  }, [departmentOptions, form.departmentCode, subject?.departmentName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.code.trim() || !form.name.trim() || !form.departmentCode.trim()) {
      setError("Vui lòng nhập đầy đủ mã môn, tên môn và bộ môn.");
      showToast("Vui lòng nhập đầy đủ thông tin bắt buộc.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        departmentCode: form.departmentCode.trim().toUpperCase(),
        gradeLevel: form.gradeLevel,
        status: form.status.trim() || undefined,
      };

      if (isEdit && subject) {
        await subjectApi.update(subject.code, payload);
        showToast("Cập nhật môn học thành công.", "success");
        router.push("/subjects");
      } else {
        await subjectApi.create(payload);
        showToast("Tạo môn học thành công.", "success");
        router.push("/subjects");
      }
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể lưu môn học.";
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
            label="Mã môn"
            value={form.code}
            disabled={isEdit}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
          />

          <FormInput
            label="Tên môn"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <FormSelect
            label="Bộ môn"
            value={form.departmentCode}
            onChange={(event) => setForm((prev) => ({ ...prev, departmentCode: event.target.value }))}
          >
              <option value="">{isLoadingDepartments ? "Đang tải bộ môn..." : "Chọn bộ môn"}</option>
              {mergedDepartmentOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
          </FormSelect>

          <FormInput
            label="Khối"
            type="number"
            min={1}
            max={12}
            value={form.gradeLevel}
            onChange={(event) => setForm((prev) => ({ ...prev, gradeLevel: Number.parseInt(event.target.value || "10", 10) }))}
          />

          <FormSelect
            label="Trạng thái"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
          </FormSelect>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-5" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo môn học"}
        </Button>
      </div>
    </form>
  );
}
