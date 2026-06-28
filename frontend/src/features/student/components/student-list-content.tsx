"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentSummaryCard } from "@/features/student/components/student-summary-card";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { StudentImportPreview } from "@/features/student/components/student-import-preview";
import { useStudentListData } from "@/features/student/student-client-data";
import { ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/shared/ui/button";
import type { StudentImportPreviewResponse } from "@/features/student/api";
import { studentService } from "@/features/student/services";
import { useToast } from "@/shared/components/toast-provider";

export function StudentListContent() {
  const { session } = useAuthSession();
  const userRole = session?.user.role;
  const [searchInput, setSearchInput] = useState("");
  const [scope, setScope] = useState<"current" | "all">("current");
  const [academicYearCode, setAcademicYearCode] = useState("");
  const [status, setStatus] = useState("");
  const [classQuery, setClassQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [lastImportId, setLastImportId] = useState<string | null>(null);
  const [showingPreview, setShowingPreview] = useState(false);
  const [previewData, setPreviewData] =
    useState<StudentImportPreviewResponse | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const debouncedSearch = useDebounce(searchInput, 350);

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await studentService.downloadImportTemplate();
      saveBlob(blob, "student_import_template.xlsx");
      showToast("Da tai template import", "success");
    } catch {
      showToast("Khong the tai template", "error");
    }
  };

  const handleSelectImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChanged = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset input immediately before any await — currentTarget is valid here
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file) {
      return;
    }

    setImporting(true);
    setCurrentFile(file);
    try {
      const response = await studentService.previewImport(file);
      const preview = response.data;
      setPreviewData(preview);
      setShowingPreview(true);
      showToast("Đã tải preview dữ liệu", "success");
    } catch (error) {
      showToast("Không thể tạo preview", "error");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromPreview = async () => {
    if (!currentFile) return;

    setImporting(true);
    try {
      const response = await studentService.importStudents(currentFile);
      const result = response.data;
      setLastImportId(result.importId);
      setShowingPreview(false);
      setPreviewData(null);
      setCurrentFile(null);

      if (result.failedRecords > 0) {
        showToast(
          `Import xong: ${result.successfulRecords} thanh cong, ${result.failedRecords} loi`,
          "info",
        );
      } else {
        showToast(
          `Import thanh cong ${result.successfulRecords} ban ghi`,
          "success",
        );
      }
    } catch {
      showToast("Import that bai", "error");
    } finally {
      setImporting(false);
    }
  };

  const handleCancelPreview = () => {
    setShowingPreview(false);
    setPreviewData(null);
    setCurrentFile(null);
  };

  const handleDownloadErrors = async () => {
    if (!lastImportId) {
      showToast("Chua co file loi de tai", "info");
      return;
    }

    try {
      const blob = await studentService.downloadImportErrors(lastImportId);
      saveBlob(blob, `student_import_errors_${lastImportId}.xlsx`);
      showToast("Da tai file loi", "success");
    } catch {
      showToast("Khong the tai file loi", "error");
    }
  };

  const filters = useMemo(
    () => ({
      scope,
      academicYearCode: academicYearCode.trim() || undefined,
      status: status.trim() || undefined,
      classQuery: classQuery.trim() || undefined,
      search: debouncedSearch.trim() || undefined,
      limit: 120,
    }),
    [scope, academicYearCode, status, classQuery, debouncedSearch],
  );

  const { records, source, isLoading, error } = useStudentListData(filters);

  // Show preview if available
  // Render different content based on role
  if (userRole === "STUDENT") {
    return <StudentSelfViewContent />;
  }

  if (userRole === "PARENT") {
    return <ParentStudentsViewContent />;
  }

  // ADMIN and TEACHER - show full student management interface
  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="HỌC SINH"
        title="Quản lý học sinh, học bạ và quá trình học theo năm học"
        description="Mặc định hiển thị học sinh trong năm học hiện tại; tìm kiếm chi tiết bằng bộ lọc bên dưới."
        actions={
          <>
            <ButtonLink href="/reports" tone="secondary">
              Xuất danh sách
            </ButtonLink>
            {userRole === "ADMIN" && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChanged}
                />
                <Button tone="secondary" onClick={handleDownloadTemplate}>
                  Download template
                </Button>
                <Button
                  tone="secondary"
                  onClick={handleSelectImportFile}
                  disabled={importing}
                >
                  {importing ? "Dang import..." : "Import Excel"}
                </Button>
                <Button tone="ghost" onClick={handleDownloadErrors}>
                  Download file loi
                </Button>
              </>
            )}
            {userRole === "ADMIN" && (
              <>
                <ButtonLink href="/classes/promotion" tone="secondary">
                  Xét lên lớp
                </ButtonLink>
                <ButtonLink href="/students/new">Thêm học sinh</ButtonLink>
              </>
            )}
          </>
        }
      />

      <StudentImportPreview
        open={showingPreview && Boolean(previewData)}
        previewData={
          previewData ?? {
            import_id: "",
            total_records: 0,
            valid_records: 0,
            invalid_records: 0,
            students: [],
            parents: [],
            errors: [],
          }
        }
        onImportComplete={handleImportFromPreview}
        onCancel={handleCancelPreview}
      />

      {error && <StudentDataState source={source} error={error} />}

      {userRole === "ADMIN" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Panel className="relative overflow-hidden border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-5 sm:p-6">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-100/70" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Nghiệp vụ học vụ
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Xét lên lớp
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Kiểm tra phương án lên lớp, lưu ban, chuyển lớp và import quyết
                định hàng loạt theo biểu mẫu.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href="/classes/promotion">
                  Mở workspace xét lên lớp
                </ButtonLink>
                <ButtonLink href="/classes" tone="secondary">
                  Xem danh sách lớp
                </ButtonLink>
              </div>
            </div>
          </Panel>

          <Panel className="relative overflow-hidden border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 sm:p-6">
            <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-emerald-100/70" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Nghiệp vụ học sinh
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Hạnh kiểm theo học kỳ
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Nhập nhận xét hạnh kiểm trong module Học sinh để theo dõi đồng
                bộ với học bạ và lịch sử học tập.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href="/students/conduct">
                  Mở quản lý hạnh kiểm
                </ButtonLink>
                <ButtonLink href="/students/conduct/new" tone="secondary">
                  Tạo bản ghi mới
                </ButtonLink>
              </div>
            </div>
          </Panel>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5 sm:p-6">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            Bộ lọc học sinh
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Tránh tải toàn bộ dữ liệu: ưu tiên phạm vi hiện tại, mở rộng khi
            cần.
          </p>

          <div className="mt-5 grid gap-3">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo mã, họ tên, lớp..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={scope}
                onChange={(event) =>
                  setScope(event.target.value as "current" | "all")
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              >
                <option value="current">Năm học hiện tại</option>
                <option value="all">Tất cả năm học</option>
              </select>
              <input
                value={academicYearCode}
                onChange={(event) => setAcademicYearCode(event.target.value)}
                placeholder="Mã năm học (vd: 2026-2027)"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={classQuery}
                onChange={(event) => setClassQuery(event.target.value)}
                placeholder="Lọc lớp (10A1 hoặc CLASS10A1)"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang học</option>
                <option value="INACTIVE">Tạm nghỉ</option>
                <option value="GRADUATED">Đã tốt nghiệp</option>
                <option value="TRANSFERRED">Chuyển trường</option>
              </select>
            </div>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                {userRole === "TEACHER"
                  ? "Học sinh lớp của tôi"
                  : "Danh sách học sinh trọng tâm"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {userRole === "TEACHER"
                  ? "Chọn một học sinh để xem chi tiết điểm số, điểm danh và lịch sử học tập."
                  : "Chọn một hồ sơ để xem chi tiết transcript, phụ huynh và lịch sử học tập."}
              </p>
            </div>
            {userRole === "ADMIN" && (
              <Link
                href="/students/new"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Tạo hồ sơ mới
              </Link>
            )}
          </div>

          <div className="mt-5 grid gap-4">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
                Đang tải danh sách học sinh...
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-sm font-medium text-amber-800">
                  Chưa có dữ liệu học sinh
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  {userRole === "TEACHER"
                    ? "Chuyên cần của bạn hiện chưa có học sinh được giao."
                    : "Hãy tạo bộ hồ sơ học sinh đầu tiên để bắt đầu"}
                </p>
                {userRole === "ADMIN" && (
                  <Link
                    href="/students/new"
                    className="mt-4 inline-block rounded-full border border-amber-300 bg-white px-6 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                  >
                    ➕ Thêm học sinh đầu tiên
                  </Link>
                )}
              </div>
            ) : (
              records.map((student) => (
                <StudentSummaryCard
                  key={student.studentCode}
                  student={student}
                />
              ))
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}

// Component for STUDENT role to view their own profile only
function StudentSelfViewContent() {
  const { session } = useAuthSession();

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="HỒ SƠ CÁ NHÂN"
        title="Hồ sơ học tập của tôi"
        description="Xem thông tin cá nhân, điểm số, điểm danh và học bạ của bạn."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-slate-950">
            Thông tin cá nhân
          </h3>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Họ và tên:
              </span>
              <span className="text-sm font-semibold text-slate-950">
                {session?.user.fullName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Email:</span>
              <span className="text-sm font-semibold text-slate-950">
                {session?.user.email}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-medium text-slate-600">
                Loại tài khoản:
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Học sinh
              </span>
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">
            Tài liệu liên quan
          </h3>
          <div className="mt-6 space-y-3">
            <Link
              href="/my-profile"
              className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ➜ Chỉnh sửa hồ sơ
            </Link>
            <Link
              href="/my-scores"
              className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ➜ Xem điểm số
            </Link>
            <Link
              href="/my-transcript"
              className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ➜ Xem học bạ
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// Component for PARENT role to view their children's profiles
function ParentStudentsViewContent() {
  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="HỌC SINH"
        title="thông tin con em"
        description="Xem thông tin, điểm số và hoạt động học tập của các con em."
      />

      <Panel className="p-6">
        <h3 className="text-lg font-semibold text-slate-950">
          Danh sách con em
        </h3>
        <div className="mt-6 rounded-lg border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            Hiện tại hệ thống chưa cấu hình kết nối phụ huynh - học sinh.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Vui lòng liên hệ nhà trường để được cấu hình tài khoản phụ huynh.
          </p>
        </div>
      </Panel>
    </div>
  );
}
