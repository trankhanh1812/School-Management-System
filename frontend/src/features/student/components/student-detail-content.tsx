"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/features/dashboard/components/data-table";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { StudentDataState } from "@/features/student/components/student-data-state";
import { useStudentDetailData } from "@/features/student/student-client-data";
import { studentApi } from "@/features/student/api";
import type { StudentRecord } from "@/features/student/student-data";
import { useConductListData } from "@/features/conduct/conduct-client-data";
import { PromotionHistoryContent } from "@/features/student/components/promotion-history-content";
import { ScoreHistoryContent } from "@/features/student/components/score-history-content";
import { EmptyState } from "@/shared/components/empty-state";
import { Panel } from "@/shared/ui/panel";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { useAuthSession } from "@/hooks/use-auth-session";

export function StudentDetailContent({ studentCode }: { studentCode: string }) {
  const router = useRouter();
  const { student, source, isLoading, error } = useStudentDetailData(studentCode);
  const { features } = useRolePermissions();
  const { session } = useAuthSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [conductLevelFilter, setConductLevelFilter] = useState("ALL");
  const [conductSemesterFilter, setConductSemesterFilter] = useState("");

  async function handleDelete() {
    if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ học sinh ${student?.fullName}? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await studentApi.delete(studentCode);
      router.push("/students");
    } catch {
      alert("Có lỗi khi xóa hồ sơ học sinh");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải hồ sơ học sinh...</div>;
  }

  if (!student) {
    return (
      <EmptyState
        title="Không tìm thấy học sinh"
        description="Không tìm thấy hồ sơ phù hợp. Vui lòng kiểm tra lại mã học sinh hoặc làm mới dữ liệu."
      />
    );
  }

  const pageTitle =
    session?.user.role === "STUDENT"
      ? `Hồ sơ cá nhân`
      : `Hồ sơ học sinh • ${student.fullName}`;

  const pageDescription =
    session?.user.role === "STUDENT"
      ? "Xem thông tin cá nhân, liên hệ phụ huynh và học bạ của bạn."
      : "Trang chi tiết này gom hồ sơ cá nhân, liên hệ phụ huynh, lịch sử học theo năm học và học bạ tóm tắt để làm nền cho student portal.";

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow={session?.user.role === "STUDENT" ? "HỒ SƠ CÁ NHÂN" : "Students / Detail"}
        title={pageTitle}
        description={pageDescription}
        actions={
          <DetailPageActions
            studentCode={studentCode}
            isDeleting={isDeleting}
            onDelete={handleDelete}
            canEdit={features.canEditStudent}
            canDelete={features.canDeleteStudent}
            isStudent={session?.user.role === "STUDENT"}
          />
        }
      />

      <StudentDataState source={source} error={error} />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-100 text-xl font-semibold text-cyan-800">
              {student.avatarLabel}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {student.studentCode}
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {student.fullName}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {student.className} • {student.academicYear} • {student.status}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p>Ngày sinh: {student.dateOfBirth}</p>
              <p className="mt-2">Giới tính: {student.gender}</p>
              <p className="mt-2">Hạnh kiểm: {student.conduct}</p>
              <p className="mt-2">Điểm trung bình: {student.scoreAverage}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p>Số điện thoại: {student.phone}</p>
              <p className="mt-2">Email: {student.email}</p>
              <p className="mt-2">Địa chỉ: {student.address}</p>
            </div>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          {session?.user.role === "STUDENT" ? (
            <StudentViewSection student={student} />
          ) : (
            <ParentAndAlertSection student={student} />
          )}
        </Panel>
      </section>

      <StudentConductQuickFilter
        studentCode={studentCode}
        levelFilter={conductLevelFilter}
        semesterFilter={conductSemesterFilter}
        onLevelFilterChange={setConductLevelFilter}
        onSemesterFilterChange={setConductSemesterFilter}
      />

      <PromotionHistoryContent studentCode={studentCode} />

      <ScoreHistoryContent studentCode={studentCode} />

      {session?.user.role !== "STUDENT" && (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <DataTable
            title="Lịch sử học tập theo năm"
            description="Dữ liệu này giúp xử lý lên lớp, lưu ban, chuyển lớp hoặc tốt nghiệp mà không ghi đè hồ sơ cũ."
            columns={["Năm học", "Lớp", "Kết quả", "Ghi chú"]}
            rows={student.academicHistory.map((item) => [
              item.academicYear,
              item.className,
              item.result,
              item.note,
            ])}
          />

          <DataTable
            title="Học bạ tóm tắt"
            description="Mẫu hiển thị cho học sinh/phụ huynh xem kết quả các môn theo học kỳ và cả năm."
            columns={["Môn học", "HK I", "HK II", "Cả năm"]}
            rows={student.transcript.map((item) => [
              item.subject,
              item.semester1,
              item.semester2,
              item.yearAverage,
            ])}
          />
        </section>
      )}

      {session?.user.role === "STUDENT" && (
        <section className="grid gap-4 xl:grid-cols-2">
          <Panel className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Tài liệu liên quan</h3>
            <div className="mt-4 space-y-2">
              <Link
                href={`/students/${studentCode}/transcript`}
                className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ➜ Xem học bạ chi tiết
              </Link>
              <Link
                href={`/students/${studentCode}/scores`}
                className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ➜ Xem điểm số
              </Link>
              <Link
                href="/my-attendance"
                className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ➜ Xem điểm danh
              </Link>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Thông tin liên hệ</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {student.parents && student.parents.length > 0 ? (
                student.parents.map((parent) => (
                  <div
                    key={`${student.studentCode}-${parent.fullName}`}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <p className="font-semibold text-slate-950">{parent.fullName}</p>
                    <p className="text-xs text-slate-500">{parent.role}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">Chưa cấu hình phụ huynh</p>
              )}
            </div>
          </Panel>
        </section>
      )}
    </div>
  );
}

function StudentConductQuickFilter({
  studentCode,
  levelFilter,
  semesterFilter,
  onLevelFilterChange,
  onSemesterFilterChange,
}: {
  studentCode: string;
  levelFilter: string;
  semesterFilter: string;
  onLevelFilterChange: (value: string) => void;
  onSemesterFilterChange: (value: string) => void;
}) {
  const { records, isLoading, error } = useConductListData();
  const normalizedStudentCode = studentCode.trim().toLowerCase();

  const studentConductRecords = useMemo(() => {
    const normalizedSemester = semesterFilter.trim().toLowerCase();

    return records.filter((item) => {
      if ((item.studentCode || "").trim().toLowerCase() !== normalizedStudentCode) {
        return false;
      }

      if (levelFilter !== "ALL" && (item.conductLevel || "") !== levelFilter) {
        return false;
      }

      if (normalizedSemester && !(item.semesterCode || "").toLowerCase().includes(normalizedSemester)) {
        return false;
      }

      return true;
    });
  }, [records, normalizedStudentCode, levelFilter, semesterFilter]);

  return (
    <section className="grid gap-4">
      <Panel className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Students / Conduct
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Lọc nhanh hạnh kiểm
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Xem bản ghi hạnh kiểm của học sinh này theo học kỳ và mức đánh giá.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
          <input
            value={semesterFilter}
            onChange={(event) => onSemesterFilterChange(event.target.value)}
            placeholder="Lọc theo mã học kỳ"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
          />
          <select
            value={levelFilter}
            onChange={(event) => onLevelFilterChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
          >
            <option value="ALL">Tất cả hạnh kiểm</option>
            <option value="Tốt">Tốt</option>
            <option value="Khá">Khá</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Yếu">Yếu</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Không thể tải dữ liệu hạnh kiểm: {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Đang tải hạnh kiểm của học sinh...</p>
      ) : (
        <p className="mt-4 text-sm font-medium text-slate-700">
          Đang hiển thị {studentConductRecords.length} bản ghi phù hợp.
        </p>
      )}
      </Panel>

      {!isLoading ? (
        <DataTable
          title={`Bản ghi hạnh kiểm (${studentConductRecords.length})`}
          description="Bộ lọc này chỉ áp dụng cho hồ sơ học sinh đang mở."
          columns={["Học kỳ", "Năm học", "Lớp", "Hạnh kiểm", "Giáo viên", "Ghi chú"]}
          rows={studentConductRecords.map((item) => [
            item.semesterCode || "N/A",
            item.academicYearCode || "N/A",
            item.className || item.classCode || "Chưa cập nhật",
            item.conductLevel || "Chưa cập nhật",
            item.assessedByName || item.assessedByTeacherCode || "Chưa cập nhật",
            item.remarks || "",
          ])}
        />
      ) : null}
    </section>
  );
}

function DetailPageActions({
  studentCode,
  isDeleting,
  onDelete,
  canEdit,
  canDelete,
  isStudent,
}: {
  studentCode: string;
  isDeleting: boolean;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
  isStudent: boolean;
}) {
  if (isStudent) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/my-profile"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Chỉnh sửa hồ sơ
        </Link>
        <Link
          href="/students"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href={`/students/${studentCode}/transcript`}
        className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Xem học bạ
      </Link>
      <Link
        href={`/students/${studentCode}/scores`}
        className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Nhập điểm
      </Link>
      {canEdit && (
        <Link
          href={`/students/${studentCode}/edit`}
          className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Chỉnh sửa hồ sơ
        </Link>
      )}
      {canDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-full border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? "Đang xóa..." : "Xóa hồ sơ"}
        </button>
      )}
      <Link
        href="/students"
        className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Quay lại danh sách
      </Link>
    </>
  );
}

function StudentViewSection({ student }: { student: StudentRecord }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800">Thông tin của bạn</p>
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          <p>
            <span className="font-medium">Mã số:</span> {student.studentCode}
          </p>
          <p>
            <span className="font-medium">Lớp:</span> {student.className}
          </p>
          <p>
            <span className="font-medium">Năm học:</span> {student.academicYear}
          </p>
          <p>
            <span className="font-medium">Trạng thái:</span> {student.status}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-950">Giáo viên chủ nhiệm</p>
        <p className="mt-2 text-sm text-slate-700">
          {student.homeroomTeacher || "Chưa được giao"}
        </p>
      </div>
    </div>
  );
}

function ParentAndAlertSection({ student }: { student: StudentRecord }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-950">Phụ huynh và cảnh báo</h3>
      
      {student.parents && student.parents.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-600 mb-3">Liên hệ phụ huynh:</p>
          <div className="space-y-2">
            {student.parents.map((parent) => (
              <div
                key={`${student.studentCode}-${parent.fullName}`}
                className="rounded-lg border border-slate-200 p-3 text-sm"
              >
                <p className="font-semibold text-slate-950">
                  {parent.role}: {parent.fullName}
                </p>
                <p className="text-slate-600">Điện thoại: {parent.phone}</p>
                <p className="text-slate-600">Email: {parent.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {student.alerts && student.alerts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Cảnh báo</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {student.alerts.map((alert: string) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
