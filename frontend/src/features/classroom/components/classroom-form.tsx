"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { classroomApi } from "@/features/classroom/api";
import type { ClassroomRecord } from "@/features/classroom/classroom-data";
import { teacherApi, type AvailableHomeroomTeacherApiRecord } from "@/features/teacher/api";
import { Button } from "@/shared/ui/button";
import { FormInput, FormSelect } from "@/shared/ui/form-field";
import { Panel } from "@/shared/ui/panel";
import { useToast } from "@/shared/components/toast-provider";

type ClassroomFormMode = "create" | "edit";

function parseGradeLevel(input: string) {
  const normalized = input.replace(/[^0-9]/g, "");
  const value = Number.parseInt(normalized, 10);
  return Number.isFinite(value) ? value : 10;
}

function normalizeAcademicYearCode(input: string) {
  return input.trim().replace(/\s*\-\s*/g, "-");
}

export function ClassroomForm({
  mode,
  classroom,
}: {
  mode: ClassroomFormMode;
  classroom?: ClassroomRecord;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    classCode: classroom?.classCode ?? "",
    className: classroom?.className ?? "",
    academicYearCode: normalizeAcademicYearCode(classroom?.academicYear ?? ""),
    gradeLevel: parseGradeLevel(classroom?.grade ?? "10"),
    homeroomTeacherCode: "",
    capacity: classroom?.totalStudents ?? 40,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [homeroomTeachers, setHomeroomTeachers] = useState<AvailableHomeroomTeacherApiRecord[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);

  useEffect(() => {
    async function fetchHomeroomTeachers() {
      try {
        setIsLoadingTeachers(true);
        const response = await teacherApi.availableHomeroomTeachers();
        if (response.data && Array.isArray(response.data)) {
          setHomeroomTeachers(response.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách giáo viên chủ nhiệm:", err);
        showToast("Không thể tải danh sách giáo viên chủ nhiệm.", "error");
      } finally {
        setIsLoadingTeachers(false);
      }
    }

    fetchHomeroomTeachers();
  }, [showToast]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.classCode.trim() || !form.className.trim() || !form.academicYearCode.trim()) {
      setError("Vui lòng nhập đầy đủ mã lớp, tên lớp và năm học.");
      showToast("Vui lòng nhập đầy đủ thông tin bắt buộc.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        classCode: form.classCode.trim().toUpperCase(),
        className: form.className.trim(),
        academicYearCode: normalizeAcademicYearCode(form.academicYearCode),
        gradeLevel: form.gradeLevel,
        homeroomTeacherCode: form.homeroomTeacherCode.trim().toUpperCase() || undefined,
        capacity: form.capacity,
      };

      if (isEdit && classroom) {
        await classroomApi.update(classroom.classCode, payload);
        showToast("Cập nhật lớp học thành công.", "success");
        router.push(`/classes/${payload.classCode}`);
      } else {
        await classroomApi.create(payload);
        showToast("Tạo lớp học thành công.", "success");
        router.push(`/classes/${payload.classCode}`);
      }
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể lưu thông tin lớp học.";
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
            label="Mã lớp"
            value={form.classCode}
            disabled={isEdit}
            onChange={(event) => setForm((prev) => ({ ...prev, classCode: event.target.value.toUpperCase() }))}
          />

          <FormInput
            label="Tên lớp"
            value={form.className}
            onChange={(event) => setForm((prev) => ({ ...prev, className: event.target.value }))}
          />

          <FormInput
            label="Năm học (mã)"
            placeholder="VD: 2026-2027"
            value={form.academicYearCode}
            onChange={(event) => setForm((prev) => ({ ...prev, academicYearCode: event.target.value }))}
          />

          <FormInput
            label="Khối"
            type="number"
            min={1}
            max={12}
            value={form.gradeLevel}
            onChange={(event) => setForm((prev) => ({ ...prev, gradeLevel: Number.parseInt(event.target.value || "10", 10) }))}
          />

          <FormSelect
            label="Chọn giáo viên chủ nhiệm"
            value={form.homeroomTeacherCode}
            disabled={isLoadingTeachers}
            onChange={(event) => setForm((prev) => ({ ...prev, homeroomTeacherCode: event.target.value }))}
          >
            <option value="">-- Chưa chọn --</option>
            {homeroomTeachers.map((teacher) => (
              <option key={teacher.teacherCode} value={teacher.teacherCode || ""}>
                {teacher.teacherCode} - {teacher.fullName} ({teacher.department})
              </option>
            ))}
          </FormSelect>

          <FormInput
            label="Sĩ số tối đa"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(event) => setForm((prev) => ({ ...prev, capacity: Number.parseInt(event.target.value || "40", 10) }))}
          />
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-5" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo lớp học"}
        </Button>
      </div>
    </form>
  );
}
