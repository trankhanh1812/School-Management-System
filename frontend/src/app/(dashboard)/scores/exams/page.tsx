"use client";

import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import {
  examApi,
  type ExamRecord,
  type ExamUpsertPayload,
} from "@/features/exam/api";
import { ExamPermissionPanel } from "@/features/exam/components/exam-permission-panel";
import { ScoreModuleTabs } from "@/features/score/components/score-module-tabs";
import {
  teachingApi,
  type TeachingAssignmentApiRecord,
} from "@/features/teaching/api";
import { useAuthSession } from "@/hooks";
import { useToast } from "@/shared/components/toast-provider";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export default function ScoreExamsPage() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const isAdmin = session?.user.role === "ADMIN";
  const isTeacher = session?.user.role === "TEACHER";
  const canManage =
    session?.user.role === "ADMIN" || session?.user.role === "TEACHER";

  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<
    TeachingAssignmentApiRecord[]
  >([]);
  const [isLoadingTeacherScope, setIsLoadingTeacherScope] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingExam, setIsSavingExam] = useState(false);

  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  const [teacherYearCode, setTeacherYearCode] = useState("");
  const [teacherSemesterCode, setTeacherSemesterCode] = useState("");
  const [teacherSubjectCode, setTeacherSubjectCode] = useState("");

  const [newExam, setNewExam] = useState<ExamUpsertPayload>({
    semesterCode: "HK1",
    academicYearCode: "2025-2026",
    subjectCode: "TOAN",
    examType: "QUIZ_15",
    title: "",
    examDate: new Date().toISOString().slice(0, 10),
    classCodes: [],
  });

  async function loadExams() {
    setIsLoading(true);
    try {
      const examResponse = await examApi.list();
      setExams(examResponse.data ?? []);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách bài kiểm tra",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    let isMounted = true;

    async function loadTeacherAssignments() {
      setIsLoadingTeacherScope(true);
      try {
        const response = await teachingApi.listMine();
        if (!isMounted) {
          return;
        }
        setTeacherAssignments(response.data ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        showToast(
          error instanceof Error
            ? error.message
            : "Không tải được phân công giảng dạy",
          "error",
        );
      } finally {
        if (isMounted) {
          setIsLoadingTeacherScope(false);
        }
      }
    }

    void loadTeacherAssignments();

    return () => {
      isMounted = false;
    };
  }, [isTeacher, showToast]);

  const teacherYearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          teacherAssignments
            .map((item) => item.academicYearCode?.trim())
            .filter((item): item is string => Boolean(item)),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [teacherAssignments],
  );

  const teacherSemesterOptions = useMemo(
    () =>
      Array.from(
        new Set(
          teacherAssignments
            .filter(
              (item) =>
                !teacherYearCode || item.academicYearCode === teacherYearCode,
            )
            .map((item) => item.semesterCode?.trim())
            .filter((item): item is string => Boolean(item)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [teacherAssignments, teacherYearCode],
  );

  const teacherSubjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    teacherAssignments
      .filter(
        (item) => !teacherYearCode || item.academicYearCode === teacherYearCode,
      )
      .filter(
        (item) =>
          !teacherSemesterCode || item.semesterCode === teacherSemesterCode,
      )
      .forEach((item) => {
        const subjectCode = item.subjectCode?.trim();
        if (!subjectCode) {
          return;
        }
        map.set(subjectCode, item.subjectName?.trim() || subjectCode);
      });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [teacherAssignments, teacherYearCode, teacherSemesterCode]);

  const teacherSubjectCodes = useMemo(
    () => teacherSubjectOptions.map((item) => item.value),
    [teacherSubjectOptions],
  );

  const teacherClassOptions = useMemo(() => {
    const map = new Map<string, string>();
    teacherAssignments
      .filter(
        (item) => !teacherYearCode || item.academicYearCode === teacherYearCode,
      )
      .filter(
        (item) =>
          !teacherSemesterCode || item.semesterCode === teacherSemesterCode,
      )
      .filter(
        (item) =>
          !teacherSubjectCode || item.subjectCode === teacherSubjectCode,
      )
      .forEach((item) => {
        const classCode = item.classCode?.trim();
        if (!classCode) {
          return;
        }
        map.set(classCode, item.className?.trim() || classCode);
      });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [
    teacherAssignments,
    teacherYearCode,
    teacherSemesterCode,
    teacherSubjectCode,
  ]);

  useEffect(() => {
    if (!isTeacher || teacherAssignments.length === 0) {
      return;
    }

    const nextYear = teacherYearOptions.includes(teacherYearCode)
      ? teacherYearCode
      : (teacherYearOptions[0] ?? "");
    if (nextYear !== teacherYearCode) {
      setTeacherYearCode(nextYear);
      return;
    }

    const nextSemester = teacherSemesterOptions.includes(teacherSemesterCode)
      ? teacherSemesterCode
      : (teacherSemesterOptions[0] ?? "");
    if (nextSemester !== teacherSemesterCode) {
      setTeacherSemesterCode(nextSemester);
      return;
    }

    const nextSubject = teacherSubjectCodes.includes(teacherSubjectCode)
      ? teacherSubjectCode
      : (teacherSubjectCodes[0] ?? "");
    if (nextSubject !== teacherSubjectCode) {
      setTeacherSubjectCode(nextSubject);
      return;
    }

    setNewExam((prev) => {
      const availableClassCodes = teacherClassOptions.map((item) => item.value);
      const currentClassCodes = prev.classCodes.filter((code) =>
        availableClassCodes.includes(code),
      );
      const nextClassCodes =
        currentClassCodes.length > 0 ? currentClassCodes : availableClassCodes;

      const unchanged =
        prev.academicYearCode === nextYear &&
        prev.semesterCode === nextSemester &&
        prev.subjectCode === nextSubject &&
        prev.classCodes.join("|") === nextClassCodes.join("|");

      if (unchanged) {
        return prev;
      }

      return {
        ...prev,
        academicYearCode: nextYear,
        semesterCode: nextSemester,
        subjectCode: nextSubject,
        classCodes: nextClassCodes,
      };
    });
  }, [
    isTeacher,
    teacherAssignments,
    teacherYearCode,
    teacherSemesterCode,
    teacherSubjectCode,
    teacherYearOptions,
    teacherSemesterOptions,
    teacherSubjectOptions,
    teacherSubjectCodes,
    teacherClassOptions,
  ]);

  const yearOptions = useMemo(
    () =>
      Array.from(new Set(exams.map((item) => item.academicYearCode)))
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a)),
    [exams],
  );

  const semesterOptions = useMemo(
    () =>
      Array.from(new Set(exams.map((item) => item.semesterCode)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [exams],
  );

  const subjectOptions = useMemo(
    () =>
      Array.from(new Set(exams.map((item) => item.subjectCode)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [exams],
  );

  const examTypeOptions = useMemo(
    () =>
      Array.from(new Set(exams.map((item) => item.examType)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [exams],
  );

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(exams.map((item) => item.status)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [exams],
  );

  const classOptions = useMemo(
    () =>
      Array.from(new Set(exams.flatMap((item) => item.classCodes)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [exams],
  );

  const filteredExams = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return exams
      .filter((item) =>
        yearFilter === "all" ? true : item.academicYearCode === yearFilter,
      )
      .filter((item) =>
        semesterFilter === "all" ? true : item.semesterCode === semesterFilter,
      )
      .filter((item) =>
        subjectFilter === "all" ? true : item.subjectCode === subjectFilter,
      )
      .filter((item) =>
        typeFilter === "all" ? true : item.examType === typeFilter,
      )
      .filter((item) =>
        statusFilter === "all" ? true : item.status === statusFilter,
      )
      .filter((item) =>
        classFilter === "all" ? true : item.classCodes.includes(classFilter),
      )
      .filter((item) => {
        if (!normalizedKeyword) {
          return true;
        }
        const haystack = [
          item.title,
          item.subjectCode,
          item.subjectName,
          item.examType,
          item.examTypeLabel,
          item.academicYearCode,
          item.semesterCode,
          ...item.classCodes,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedKeyword);
      })
      .sort((a, b) => {
        const byYear = b.academicYearCode.localeCompare(a.academicYearCode);
        if (byYear !== 0) {
          return byYear;
        }

        const bySemester = a.semesterCode.localeCompare(b.semesterCode);
        if (bySemester !== 0) {
          return bySemester;
        }

        return b.examDate.localeCompare(a.examDate);
      });
  }, [
    exams,
    yearFilter,
    semesterFilter,
    subjectFilter,
    typeFilter,
    statusFilter,
    classFilter,
    keyword,
  ]);

  async function handleCreateExam() {
    if (isTeacher && isLoadingTeacherScope) {
      showToast(
        "Đang tải phạm vi phân công giảng dạy, vui lòng thử lại",
        "error",
      );
      return;
    }

    if (!newExam.title.trim()) {
      showToast("Vui lòng nhập tên bài kiểm tra", "error");
      return;
    }
    if (newExam.classCodes.length === 0) {
      showToast("Vui lòng nhập ít nhất một lớp", "error");
      return;
    }

    setIsSavingExam(true);
    try {
      await examApi.create(newExam);
      showToast("Đã tạo bài kiểm tra", "success");
      await loadExams();
      setNewExam((prev) => ({ ...prev, title: "", classCodes: [] }));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Không tạo được bài kiểm tra",
        "error",
      );
    } finally {
      setIsSavingExam(false);
    }
  }

  if (!canManage) {
    return (
      <Panel className="p-6 text-sm text-rose-700">
        Màn hình kiểm tra chỉ dành cho TEACHER hoặc ADMIN.
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Exam"
        title="Quản lý bài kiểm tra"
        description="Tạo và theo dõi các đợt kiểm tra theo năm học, học kỳ, môn học và lớp áp dụng."
        actions={
          <>
            {isAdmin ? (
              <ButtonLink href="/system-settings" tone="secondary">
                Cấu hình hệ thống
              </ButtonLink>
            ) : (
              <ButtonLink href="/schedule" tone="secondary">
                Xem lịch giảng dạy của tôi
              </ButtonLink>
            )}
            <ButtonLink href="/scores/gradebook">Sang tab Điểm số</ButtonLink>
          </>
        }
      />

      <ScoreModuleTabs />

      <Panel className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Bộ lọc kiểm tra
            </h3>
            <p className="text-sm text-slate-500">
              Lọc theo phạm vi học kỳ, môn học, loại bài và trạng thái xử lý.
            </p>
          </div>
          <Button
            tone="ghost"
            onClick={() => {
              setYearFilter("all");
              setSemesterFilter("all");
              setSubjectFilter("all");
              setTypeFilter("all");
              setStatusFilter("all");
              setClassFilter("all");
              setKeyword("");
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Năm học">
            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {yearOptions.map((value) => (
                <option key={`year-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Học kỳ">
            <select
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {semesterOptions.map((value) => (
                <option key={`semester-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Môn học">
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {subjectOptions.map((value) => (
                <option key={`subject-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Loại điểm">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {examTypeOptions.map((value) => (
                <option key={`type-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Lớp áp dụng">
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {classOptions.map((value) => (
                <option key={`class-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Trạng thái">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              {statusOptions.map((value) => (
                <option key={`status-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Từ khóa">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tên bài, môn, lớp..."
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
          </Field>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
              Kết quả
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {filteredExams.length}/{exams.length} bài kiểm tra
            </p>
          </div>
        </div>
      </Panel>

      {canManage ? (
        <Panel className="p-5 sm:p-6">
          {!isAdmin ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Bạn chỉ có thể tạo bài kiểm tra cho đúng môn và lớp đang được phân
              công giảng dạy.
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            {isTeacher ? (
              <>
                <Field label="Năm học">
                  <select
                    value={teacherYearCode}
                    onChange={(event) => setTeacherYearCode(event.target.value)}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                    disabled={
                      isLoadingTeacherScope || teacherYearOptions.length === 0
                    }
                  >
                    {teacherYearOptions.map((value) => (
                      <option key={`teacher-year-${value}`} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Học kỳ">
                  <select
                    value={teacherSemesterCode}
                    onChange={(event) =>
                      setTeacherSemesterCode(event.target.value)
                    }
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                    disabled={
                      isLoadingTeacherScope ||
                      teacherSemesterOptions.length === 0
                    }
                  >
                    {teacherSemesterOptions.map((value) => (
                      <option key={`teacher-semester-${value}`} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Môn học">
                  <select
                    value={teacherSubjectCode}
                    onChange={(event) =>
                      setTeacherSubjectCode(event.target.value)
                    }
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                    disabled={
                      isLoadingTeacherScope ||
                      teacherSubjectOptions.length === 0
                    }
                  >
                    {teacherSubjectOptions.map((item) => (
                      <option
                        key={`teacher-subject-${item.value}`}
                        value={item.value}
                      >
                        {item.value === item.label
                          ? item.value
                          : `${item.value} - ${item.label}`}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            ) : (
              <>
                <Field label="Năm học">
                  <input
                    value={newExam.academicYearCode}
                    onChange={(event) =>
                      setNewExam((prev) => ({
                        ...prev,
                        academicYearCode: event.target.value.toUpperCase(),
                      }))
                    }
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </Field>
                <Field label="Học kỳ">
                  <input
                    value={newExam.semesterCode}
                    onChange={(event) =>
                      setNewExam((prev) => ({
                        ...prev,
                        semesterCode: event.target.value.toUpperCase(),
                      }))
                    }
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </Field>
                <Field label="Mã môn">
                  <input
                    value={newExam.subjectCode}
                    onChange={(event) =>
                      setNewExam((prev) => ({
                        ...prev,
                        subjectCode: event.target.value.toUpperCase(),
                      }))
                    }
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </Field>
              </>
            )}
            <Field label="Loại điểm">
              <select
                value={newExam.examType}
                onChange={(event) =>
                  setNewExam((prev) => ({
                    ...prev,
                    examType: event.target.value,
                  }))
                }
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="ORAL">Điểm miệng</option>
                <option value="QUIZ_15">15 phút</option>
                <option value="ONE_PERIOD">1 tiết</option>
                <option value="MIDTERM">Giữa kỳ</option>
                <option value="FINAL">Cuối kỳ</option>
                <option value="SURVEY">Khảo sát</option>
              </select>
            </Field>
            <Field label="Ngày thi">
              <input
                type="date"
                value={newExam.examDate}
                onChange={(event) =>
                  setNewExam((prev) => ({
                    ...prev,
                    examDate: event.target.value,
                  }))
                }
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
            </Field>

            {isTeacher ? (
              <div className="md:col-span-3">
                <Field label="Lớp phụ trách">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Button
                        tone="ghost"
                        className="h-8 px-3 text-xs"
                        onClick={() =>
                          setNewExam((prev) => ({
                            ...prev,
                            classCodes: teacherClassOptions.map(
                              (item) => item.value,
                            ),
                          }))
                        }
                        disabled={teacherClassOptions.length === 0}
                      >
                        Chọn tất cả
                      </Button>
                      <Button
                        tone="ghost"
                        className="h-8 px-3 text-xs"
                        onClick={() =>
                          setNewExam((prev) => ({ ...prev, classCodes: [] }))
                        }
                        disabled={newExam.classCodes.length === 0}
                      >
                        Bỏ chọn
                      </Button>
                    </div>
                    {teacherClassOptions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Không có lớp phù hợp trong phạm vi phân công hiện tại.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {teacherClassOptions.map((item) => {
                          const checked = newExam.classCodes.includes(
                            item.value,
                          );
                          return (
                            <label
                              key={item.value}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  setNewExam((prev) => {
                                    const set = new Set(prev.classCodes);
                                    if (event.target.checked) {
                                      set.add(item.value);
                                    } else {
                                      set.delete(item.value);
                                    }
                                    return {
                                      ...prev,
                                      classCodes: Array.from(set).sort((a, b) =>
                                        a.localeCompare(b),
                                      ),
                                    };
                                  });
                                }}
                              />
                              <span>
                                {item.value} - {item.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            ) : (
              <Field label="Mã lớp (ngăn cách bởi dấu phẩy)">
                <input
                  value={newExam.classCodes.join(",")}
                  onChange={(event) =>
                    setNewExam((prev) => ({
                      ...prev,
                      classCodes: event.target.value
                        .split(",")
                        .map((item) => item.trim().toUpperCase())
                        .filter(Boolean),
                    }))
                  }
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </Field>
            )}
          </div>

          <div className="mt-3 grid gap-2">
            <label className="text-sm font-semibold text-slate-800">
              Tên bài kiểm tra
            </label>
            <input
              value={newExam.title}
              onChange={(event) =>
                setNewExam((prev) => ({ ...prev, title: event.target.value }))
              }
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleCreateExam}
              disabled={
                isSavingExam ||
                (isTeacher &&
                  (isLoadingTeacherScope || teacherAssignments.length === 0))
              }
            >
              {isSavingExam ? "Đang tạo..." : "Tạo bài kiểm tra"}
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-600">
            Đang tải danh sách bài kiểm tra...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Tiêu đề</th>
                  <th className="px-4 py-3 text-left">Môn</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Năm học</th>
                  <th className="px-4 py-3 text-left">Học kỳ</th>
                  <th className="px-4 py-3 text-left">Lớp áp dụng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <React.Fragment key={exam.examId}>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">{exam.title}</td>
                      <td className="px-4 py-3">{exam.subjectCode}</td>
                      <td className="hidden sm:table-cell px-4 py-3">{exam.examTypeLabel || exam.examType}</td>
                      <td className="hidden md:table-cell px-4 py-3">{exam.academicYearCode}</td>
                      <td className="hidden md:table-cell px-4 py-3">{exam.semesterCode}</td>
                      <td className="hidden lg:table-cell px-4 py-3">{exam.classCodes.join(", ")}</td>
                      <td className="px-4 py-3">{exam.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <ButtonLink
                            href={`/scores/gradebook?examId=${encodeURIComponent(exam.examId)}`}
                            tone="secondary"
                            className="h-8 px-3 text-xs"
                          >
                            Mở điểm số
                          </ButtonLink>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setExpandedExamId(expandedExamId === exam.examId ? null : exam.examId)}
                              className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                              {expandedExamId === exam.examId ? "Đóng" : "Quyền thi"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isAdmin && expandedExamId === exam.examId && (
                      <tr key={`${exam.examId}-perm`} className="bg-slate-50">
                        <td colSpan={8} className="px-4 py-4">
                          <ExamPermissionPanel
                            examId={exam.examId}
                            examTitle={exam.title}
                            classCodes={exam.classCodes}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredExams.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={8}>
                      {exams.length === 0
                        ? "Chưa có bài kiểm tra."
                        : "Không có bài kiểm tra phù hợp bộ lọc."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
