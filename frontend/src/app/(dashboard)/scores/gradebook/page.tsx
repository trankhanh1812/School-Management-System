"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { examApi, type ExamRecord } from "@/features/exam/api";
import { scoreApi, type ScoreImportPreviewResponse, type ScoreRecord } from "@/features/score/api";
import { ScoreImportPreview } from "@/features/score/components/score-import-preview";
import { ScoreModuleTabs } from "@/features/score/components/score-module-tabs";
import { useAuthSession } from "@/hooks";
import { useToast } from "@/shared/components/toast-provider";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

export default function ScoreGradebookPage() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const isAdmin = session?.user.role === "ADMIN";
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "TEACHER";

  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [yearScope, setYearScope] = useState("all");
  const [semesterScope, setSemesterScope] = useState("all");
  const [classScope, setClassScope] = useState("all");

  const [studentKeyword, setStudentKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [showEditableOnly, setShowEditableOnly] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<ScoreImportPreviewResponse | null>(null);
  const [isPreviewingImport, setIsPreviewingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const selectedExam = useMemo(
    () => exams.find((item) => item.examId === selectedExamId),
    [exams, selectedExamId],
  );

  const yearOptions = useMemo(
    () => Array.from(new Set(exams.map((item) => item.academicYearCode))).filter(Boolean).sort((a, b) => b.localeCompare(a)),
    [exams],
  );

  const semesterOptions = useMemo(
    () => Array.from(new Set(exams.map((item) => item.semesterCode))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [exams],
  );

  const classScopeOptions = useMemo(
    () => Array.from(new Set(exams.flatMap((item) => item.classCodes))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [exams],
  );

  const scopedExams = useMemo(
    () =>
      exams
        .filter((item) => (yearScope === "all" ? true : item.academicYearCode === yearScope))
        .filter((item) => (semesterScope === "all" ? true : item.semesterCode === semesterScope))
        .filter((item) => (classScope === "all" ? true : item.classCodes.includes(classScope))),
    [exams, yearScope, semesterScope, classScope],
  );

  const scoreStatusOptions = useMemo(
    () => Array.from(new Set(scores.map((item) => item.status))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [scores],
  );

  const teacherOptions = useMemo(
    () => Array.from(new Set(scores.map((item) => item.teacherName))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [scores],
  );

  const classOptions = useMemo(
    () => Array.from(new Set(scores.map((item) => item.classCode))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [scores],
  );

  const filteredScores = useMemo(() => {
    const normalizedKeyword = studentKeyword.trim().toLowerCase();

    return scores
      .filter((item) => (statusFilter === "all" ? true : item.status === statusFilter))
      .filter((item) => (teacherFilter === "all" ? true : item.teacherName === teacherFilter))
      .filter((item) => (classFilter === "all" ? true : item.classCode === classFilter))
      .filter((item) => (showEditableOnly ? item.editable : true))
      .filter((item) => {
        if (!normalizedKeyword) {
          return true;
        }

        const haystack = [item.studentName, item.studentCode, item.classCode, item.examType, item.teacherName]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedKeyword);
      });
  }, [scores, statusFilter, teacherFilter, classFilter, showEditableOnly, studentKeyword]);

  async function loadData(initialExamId?: string) {
    setIsLoading(true);
    try {
      const examResponse = await examApi.list();
      const examData = examResponse.data ?? [];
      setExams(examData);

      const nextExamId = initialExamId ?? selectedExamId ?? examData[0]?.examId ?? "";
      setSelectedExamId(nextExamId);

      if (nextExamId) {
        const scoreResponse = await scoreApi.list(nextExamId);
        setScores(scoreResponse.data ?? []);
      } else {
        setScores([]);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được dữ liệu điểm", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const examIdFromQuery = searchParams.get("examId")?.trim() ?? "";
    void loadData(examIdFromQuery || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function loadScores() {
      if (!selectedExamId) {
        setScores([]);
        return;
      }
      try {
        const response = await scoreApi.list(selectedExamId);
        setScores(response.data ?? []);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Không tải được điểm", "error");
      }
    }

    void loadScores();
  }, [selectedExamId, showToast]);

  async function handleSubmitScores() {
    if (!selectedExamId) {
      return;
    }
    try {
      await scoreApi.submit(selectedExamId);
      showToast("Đã submit điểm để chờ duyệt", "success");
      await loadData(selectedExamId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không submit được điểm", "error");
    }
  }

  async function handleApproveScore(scoreId: string) {
    try {
      await scoreApi.approve(scoreId);
      showToast("Đã phê duyệt điểm", "success");
      await loadData(selectedExamId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không phê duyệt được", "error");
    }
  }

  async function handlePublishScores() {
    if (!selectedExamId) {
      return;
    }
    try {
      await scoreApi.publish(selectedExamId);
      showToast("Đã công bố điểm", "success");
      await loadData(selectedExamId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không công bố được", "error");
    }
  }

  async function handleQuickUpdate(score: ScoreRecord, nextValue: string) {
    const numeric = Number(nextValue);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10) {
      return;
    }

    try {
      await scoreApi.update(score.scoreId, {
        scoreValue: numeric,
        changeReason: "Cập nhật nhanh từ màn quản lý điểm",
      });
      await loadData(selectedExamId);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được điểm", "error");
    }
  }

  async function handleDownloadImportTemplate() {
    try {
      const blob = await scoreApi.downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Template_Import_Diem.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được template import điểm", "error");
    }
  }

  function handleSelectImportFile() {
    importFileRef.current?.click();
  }

  async function handleImportFileChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsPreviewingImport(true);
    try {
      const response = await scoreApi.previewImport(file);
      setPendingImportFile(file);
      setImportPreviewData(response.data ?? null);
      setShowImportPreview(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tạo được preview import điểm", "error");
    } finally {
      setIsPreviewingImport(false);
    }
  }

  function handleCloseImportPreview() {
    setShowImportPreview(false);
    setImportPreviewData(null);
    setPendingImportFile(null);
  }

  async function handleImportFromPreview() {
    if (!pendingImportFile) {
      return;
    }

    setIsImporting(true);
    try {
      await scoreApi.importScores(pendingImportFile);
      await loadData(selectedExamId);
      handleCloseImportPreview();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không import được điểm", "error");
    } finally {
      setIsImporting(false);
    }
  }

  if (!canManage) {
    return (
      <Panel className="p-6 text-sm text-rose-700">
        Màn hình điểm số chỉ dành cho TEACHER hoặc ADMIN.
      </Panel>
    );
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Score"
        title="Quản lý điểm số"
        description="Workflow: DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED -> LOCKED. Vắng tính 0; chỉ ADMIN phê duyệt và công bố."
        actions={
          <>
            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFileChanged}
            />
            <ButtonLink href="/scores/exams" tone="secondary">
              Sang tab Kiểm tra
            </ButtonLink>
            <Button tone="secondary" onClick={handleDownloadImportTemplate}>
              Download template import điểm
            </Button>
            <Button tone="secondary" onClick={handleSelectImportFile} disabled={isPreviewingImport || isImporting}>
              {isPreviewingImport ? "Đang preview..." : "Import Excel"}
            </Button>
            <ButtonLink href="/students">Mở hồ sơ học sinh</ButtonLink>
          </>
        }
      />

      <ScoreModuleTabs />

      <ScoreImportPreview
        open={showImportPreview && Boolean(importPreviewData)}
        previewData={importPreviewData ?? { importId: "", totalRecords: 0, validRecords: 0, invalidRecords: 0, rows: [], issues: [] }}
        onImportComplete={handleImportFromPreview}
        onCancel={handleCloseImportPreview}
      />

      <Panel className="p-5 sm:p-6">
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Năm học</label>
            <select value={yearScope} onChange={(event) => setYearScope(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Tất cả</option>
              {yearOptions.map((value) => (
                <option key={`year-${value}`} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Học kỳ</label>
            <select value={semesterScope} onChange={(event) => setSemesterScope(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Tất cả</option>
              {semesterOptions.map((value) => (
                <option key={`semester-${value}`} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Lớp áp dụng</label>
            <select value={classScope} onChange={(event) => setClassScope(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Tất cả</option>
              {classScopeOptions.map((value) => (
                <option key={`scope-class-${value}`} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Bài kiểm tra</label>
            <select
              value={selectedExamId}
              onChange={(event) => setSelectedExamId(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">-- Chọn bài kiểm tra --</option>
              {scopedExams.map((exam) => (
                <option key={exam.examId} value={exam.examId}>
                  {exam.title} ({exam.subjectCode} - {exam.classCodes.join(", ")})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Tìm học sinh</label>
            <input
              value={studentKeyword}
              onChange={(event) => setStudentKeyword(event.target.value)}
              placeholder="Tên, mã học sinh, lớp..."
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button tone="secondary" onClick={handleSubmitScores} disabled={!selectedExamId || isLoading}>
              Submit
            </Button>
            {isAdmin ? (
              <Button tone="primary" onClick={handlePublishScores} disabled={!selectedExamId || isLoading}>
                Publish
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Trạng thái điểm</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Tất cả</option>
              {scoreStatusOptions.map((value) => (
                <option key={`score-status-${value}`} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Giáo viên</label>
            <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Tất cả</option>
              {teacherOptions.map((value) => (
                <option key={`teacher-${value}`} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Lớp</label>
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="all">Tất cả</option>
              {classOptions.map((value) => (
                <option key={`class-${value}`} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showEditableOnly}
              onChange={(event) => setShowEditableOnly(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Chỉ hiện bản ghi còn chỉnh sửa
          </label>

          <div className="flex items-end">
            <Button
              tone="ghost"
              onClick={() => {
                setStudentKeyword("");
                setStatusFilter("all");
                setTeacherFilter("all");
                setClassFilter("all");
                setShowEditableOnly(false);
              }}
              className="h-10"
            >
              Xóa lọc điểm
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Kết quả: <span className="font-semibold text-slate-900">{filteredScores.length}</span> / {scores.length} bản ghi điểm.
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-600">Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Học sinh</th>
                    <th className="px-4 py-3 text-left">Lớp</th>
                    <th className="px-4 py-3 text-left">Loại điểm</th>
                    <th className="px-4 py-3 text-left">Giá trị</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-left">Giáo viên</th>
                    {isAdmin ? <th className="px-4 py-3 text-left">Duyệt</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((score) => (
                    <tr key={score.scoreId} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        {score.studentName} ({score.studentCode})
                      </td>
                      <td className="px-4 py-3">{score.classCode}</td>
                      <td className="px-4 py-3">{score.examType}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          defaultValue={score.scoreValue ?? 0}
                          disabled={!score.editable}
                          onBlur={(event) => void handleQuickUpdate(score, event.target.value)}
                          className="h-9 w-24 rounded-lg border border-slate-200 px-2"
                        />
                      </td>
                      <td className="px-4 py-3">{score.status}</td>
                      <td className="px-4 py-3">{score.teacherName}</td>
                      {isAdmin ? (
                        <td className="px-4 py-3">
                          <Button
                            tone="secondary"
                            className="h-8 px-3 text-xs"
                            onClick={() => void handleApproveScore(score.scoreId)}
                            disabled={score.status === "APPROVED" || score.status === "PUBLISHED" || score.status === "LOCKED"}
                          >
                            Approve
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                  {filteredScores.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={isAdmin ? 7 : 6}>
                        {selectedExam
                          ? scores.length === 0
                            ? "Không có dữ liệu điểm cho bài kiểm tra đã chọn"
                            : "Không có dữ liệu điểm phù hợp bộ lọc"
                          : "Chưa có bài kiểm tra"}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredScores.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                  {selectedExam
                    ? scores.length === 0
                      ? "Không có dữ liệu điểm cho bài kiểm tra đã chọn"
                      : "Không có dữ liệu điểm phù hợp bộ lọc"
                    : "Chưa có bài kiểm tra"}
                </div>
              ) : (
                filteredScores.map((score) => (
                  <div key={`mobile-${score.scoreId}`} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">{score.studentName}</p>
                    <p className="text-xs text-slate-500">{score.studentCode} • {score.classCode}</p>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Loại điểm</p>
                        <p className="font-medium text-slate-800">{score.examType}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Trạng thái</p>
                        <p className="font-medium text-slate-800">{score.status}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Giáo viên</p>
                        <p className="font-medium text-slate-800">{score.teacherName}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="mb-1 text-xs uppercase tracking-[0.08em] text-slate-500">Giá trị</p>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          defaultValue={score.scoreValue ?? 0}
                          disabled={!score.editable}
                          onBlur={(event) => void handleQuickUpdate(score, event.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 px-3"
                        />
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="mt-3 flex justify-end">
                        <Button
                          tone="secondary"
                          className="h-8 px-3 text-xs"
                          onClick={() => void handleApproveScore(score.scoreId)}
                          disabled={score.status === "APPROVED" || score.status === "PUBLISHED" || score.status === "LOCKED"}
                        >
                          Approve
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
