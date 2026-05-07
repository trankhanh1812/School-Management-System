"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { classroomApi } from "@/features/classroom/api";
import { subjectApi } from "@/features/subject/api";
import { teacherApi } from "@/features/teacher/api";
import { teachingApi } from "@/features/teaching/api";
import type { TeachingAssignmentRecord } from "@/features/teaching/teaching-data";
import { Button } from "@/shared/ui/button";
import { FormCheckbox, FormSelect } from "@/shared/ui/form-field";
import { Panel } from "@/shared/ui/panel";
import { useToast } from "@/shared/components/toast-provider";

type TeachingFormMode = "create" | "edit";

type Option = {
  value: string;
  label: string;
};

function normalizeAcademicYearCode(input: string) {
  return input.replace(/\s+/g, "").replace(/(\d{4})-(\d{4})/, "$1-$2");
}

export function TeachingForm({
  mode,
  assignment,
}: {
  mode: TeachingFormMode;
  assignment?: TeachingAssignmentRecord;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = mode === "edit";
  const [teacherOptions, setTeacherOptions] = useState<Option[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<Option[]>([
    { value: "HK1", label: "Học kỳ I" },
    { value: "HK2", label: "Học kỳ II" },
  ]);
  const [yearOptions, setYearOptions] = useState<Option[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [form, setForm] = useState({
    teacherCode: assignment?.teacherCode ?? "",
    classCode: assignment?.classCode ?? "",
    subjectCode: assignment?.subjectCode ?? "",
    semesterCode: assignment?.semesterCode ?? "HK1",
    academicYearCode: assignment?.academicYearCode ?? "2026-2027",
    isHomeroom: assignment?.homeroom ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      setIsLoadingOptions(true);
      try {
        const [teacherRes, classRes, subjectRes, teachingRes] = await Promise.all([
          teacherApi.list(),
          classroomApi.list(),
          subjectApi.list(),
          teachingApi.list(),
        ]);

        if (!mounted) {
          return;
        }

        const teacherRows = Array.isArray(teacherRes.data) ? teacherRes.data : [];
        setTeacherOptions(
          teacherRows
            .filter((item) => typeof item.teacherCode === "string" && item.teacherCode)
            .map((item) => ({
              value: item.teacherCode as string,
              label: `${item.fullName ?? item.teacherCode}`,
            })),
        );

        const classRows = Array.isArray(classRes.data) ? classRes.data : [];
        setClassOptions(
          classRows
            .filter((item) => typeof item.classCode === "string" && item.classCode)
            .map((item) => ({
              value: item.classCode as string,
              label: `${item.className ?? item.classCode}`,
            })),
        );

        const subjectRows = Array.isArray(subjectRes.data) ? subjectRes.data : [];
        setSubjectOptions(
          subjectRows
            .filter((item) => typeof item.code === "string" && item.code)
            .map((item) => ({
              value: item.code as string,
              label: `${item.name ?? item.code}`,
            })),
        );

        const teachingRows = Array.isArray(teachingRes.data) ? teachingRes.data : [];
        const semesterMap = new Map<string, string>();
        for (const item of teachingRows) {
          const semesterCode = typeof item.semesterCode === "string" ? item.semesterCode : "";
          if (!semesterCode || semesterMap.has(semesterCode)) {
            continue;
          }
          if (semesterCode === "HK1") {
            semesterMap.set(semesterCode, "Học kỳ I");
          } else if (semesterCode === "HK2") {
            semesterMap.set(semesterCode, "Học kỳ II");
          } else {
            semesterMap.set(semesterCode, semesterCode);
          }
        }
        if (semesterMap.size > 0) {
          setSemesterOptions(Array.from(semesterMap.entries()).map(([value, label]) => ({ value, label })));
        }

        const yearMap = new Map<string, string>();
        for (const item of classRows) {
          const rawYear = typeof item.academicYear === "string" ? item.academicYear : "";
          const yearCode = normalizeAcademicYearCode(rawYear);
          if (!yearCode || yearMap.has(yearCode)) {
            continue;
          }
          yearMap.set(yearCode, rawYear || yearCode);
        }
        for (const item of teachingRows) {
          const rawYear = typeof item.academicYearCode === "string" ? item.academicYearCode : "";
          const yearCode = normalizeAcademicYearCode(rawYear);
          if (!yearCode || yearMap.has(yearCode)) {
            continue;
          }
          yearMap.set(yearCode, yearCode);
        }
        setYearOptions(Array.from(yearMap.entries()).map(([value, label]) => ({ value, label })));
      } catch {
        if (!mounted) {
          return;
        }
        setTeacherOptions([]);
        setClassOptions([]);
        setSubjectOptions([]);
        setYearOptions([]);
      } finally {
        if (mounted) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const displayTeacherOptions = useMemo(() => {
    if (!assignment || teacherOptions.some((item) => item.value === assignment.teacherCode)) {
      return teacherOptions;
    }

    return [{ value: assignment.teacherCode, label: assignment.teacherName }, ...teacherOptions];
  }, [assignment, teacherOptions]);

  const displayClassOptions = useMemo(() => {
    if (!assignment || classOptions.some((item) => item.value === assignment.classCode)) {
      return classOptions;
    }

    return [{ value: assignment.classCode, label: assignment.className }, ...classOptions];
  }, [assignment, classOptions]);

  const displaySubjectOptions = useMemo(() => {
    if (!assignment || subjectOptions.some((item) => item.value === assignment.subjectCode)) {
      return subjectOptions;
    }

    return [{ value: assignment.subjectCode, label: assignment.subjectName }, ...subjectOptions];
  }, [assignment, subjectOptions]);

  const displayYearOptions = useMemo(() => {
    if (!form.academicYearCode || yearOptions.some((item) => item.value === form.academicYearCode)) {
      return yearOptions;
    }

    return [{ value: form.academicYearCode, label: form.academicYearCode }, ...yearOptions];
  }, [form.academicYearCode, yearOptions]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.teacherCode.trim() || !form.classCode.trim() || !form.subjectCode.trim()) {
      setError("Vui lòng chọn đầy đủ giáo viên, lớp và môn học.");
      showToast("Vui lòng chọn đầy đủ giáo viên, lớp và môn học.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        teacherCode: form.teacherCode.trim().toUpperCase(),
        classCode: form.classCode.trim().toUpperCase(),
        subjectCode: form.subjectCode.trim().toUpperCase(),
        semesterCode: form.semesterCode.trim().toUpperCase(),
        academicYearCode: normalizeAcademicYearCode(form.academicYearCode),
        isHomeroom: form.isHomeroom,
      };

      if (isEdit && assignment) {
        await teachingApi.update(assignment.assignmentId, payload);
        showToast("Cập nhật phân công thành công.", "success");
      } else {
        await teachingApi.create(payload);
        showToast("Tạo phân công thành công.", "success");
      }

      router.push("/teaching-assignments");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể lưu phân công.";
      setError(message);
      showToast(message, "error");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Panel className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Giáo viên"
            value={form.teacherCode}
            onChange={(event) => setForm((prev) => ({ ...prev, teacherCode: event.target.value }))}
          >
              <option value="">{isLoadingOptions ? "Đang tải giáo viên..." : "Chọn giáo viên"}</option>
              {displayTeacherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </FormSelect>

          <FormSelect
            label="Lớp"
            value={form.classCode}
            onChange={(event) => setForm((prev) => ({ ...prev, classCode: event.target.value }))}
          >
              <option value="">{isLoadingOptions ? "Đang tải lớp..." : "Chọn lớp"}</option>
              {displayClassOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </FormSelect>

          <FormSelect
            label="Môn học"
            value={form.subjectCode}
            onChange={(event) => setForm((prev) => ({ ...prev, subjectCode: event.target.value }))}
          >
              <option value="">{isLoadingOptions ? "Đang tải môn học..." : "Chọn môn học"}</option>
              {displaySubjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </FormSelect>

          <FormSelect
            label="Học kỳ"
            value={form.semesterCode}
            onChange={(event) => setForm((prev) => ({ ...prev, semesterCode: event.target.value }))}
          >
              <option value="">Chọn học kỳ</option>
              {semesterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </FormSelect>

          <FormSelect
            label="Năm học"
            value={form.academicYearCode}
            onChange={(event) => setForm((prev) => ({ ...prev, academicYearCode: event.target.value }))}
          >
              <option value="">{isLoadingOptions ? "Đang tải năm học..." : "Chọn năm học"}</option>
              {displayYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </FormSelect>

          <FormCheckbox
            label="Dạy chủ nhiệm"
            checked={form.isHomeroom}
            onChange={(checked) => setForm((prev) => ({ ...prev, isHomeroom: checked }))}
          />
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-5" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo phân công"}
        </Button>
      </div>
    </form>
  );
}
