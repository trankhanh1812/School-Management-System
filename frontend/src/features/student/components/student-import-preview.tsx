"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudentImportPreviewResponse } from "@/features/student/api";
import { Panel } from "@/shared/ui/panel";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";

interface StudentImportPreviewProps {
  open: boolean;
  previewData: StudentImportPreviewResponse;
  onImportComplete: () => Promise<void>;
  onCancel: () => void;
}

export function StudentImportPreview({
  open,
  previewData,
  onImportComplete,
  onCancel,
}: StudentImportPreviewProps) {
  const [deletedRows, setDeletedRows] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "parents">(
    "students",
  );

  useEffect(() => {
    if (!open) return;
    setDeletedRows(new Set());
    setActiveTab("students");
  }, [open, previewData]);

  const stats = useMemo(() => {
    const activeStudents = previewData.students.filter(
      (s) => !deletedRows.has(`student-${s.row_number}`),
    );
    const activeParents = previewData.parents.filter(
      (p) => !deletedRows.has(`parent-${p.row_number}`),
    );
    return {
      students: activeStudents.length,
      parents: activeParents.length,
      validStudents: activeStudents.filter((s) => !s.has_errors).length,
      validParents: activeParents.filter((p) => !p.has_errors).length,
      errorStudents: activeStudents.filter((s) => s.has_errors).length,
      errorParents: activeParents.filter((p) => p.has_errors).length,
    };
  }, [previewData, deletedRows]);

  const totalErrors = stats.errorStudents + stats.errorParents;
  const totalValid = stats.validStudents + stats.validParents;

  function toggleDelete(type: "student" | "parent", rowNumber: number) {
    const key = `${type}-${rowNumber}`;
    setDeletedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleImport() {
    setImporting(true);
    try {
      await onImportComplete();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Xem trước nhập dữ liệu danh sách học sinh"
      description="Kiểm tra dữ liệu trước khi xác nhận nhập. Các dòng lỗi được đánh dấu vàng."
      onClose={onCancel}
      size="lg"
      footer={
        <>
          <Button tone="ghost" onClick={onCancel} disabled={importing}>
            Hủy
          </Button>
          <Button
            onClick={() => void handleImport()}
            disabled={importing || stats.students + stats.parents === 0}
          >
            {importing
              ? "Đang import..."
              : `Xác nhận import ${totalValid} dòng hợp lệ`}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {/* Summary bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xl font-bold text-slate-900">{stats.students}</p>
            <p className="text-xs text-slate-500">Học sinh</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xl font-bold text-slate-900">{stats.parents}</p>
            <p className="text-xs text-slate-500">Phụ huynh</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-xl font-bold text-emerald-700">{totalValid}</p>
            <p className="text-xs text-emerald-600">Hợp lệ</p>
          </div>
          <div
            className={`rounded-xl border px-4 py-3 text-center ${totalErrors > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}
          >
            <p
              className={`text-xl font-bold ${totalErrors > 0 ? "text-amber-700" : "text-slate-400"}`}
            >
              {totalErrors}
            </p>
            <p
              className={`text-xs ${totalErrors > 0 ? "text-amber-600" : "text-slate-400"}`}
            >
              Có lỗi
            </p>
          </div>
        </div>

        {totalErrors > 0 && (
          <Panel className="border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <span className="font-semibold">{totalErrors} dòng có lỗi</span> —
            vẫn có thể import, các dòng lỗi sẽ bị bỏ qua. Kiểm tra cột lỗi để
            biết chi tiết.
          </Panel>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === "students"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Học sinh ({stats.students})
            {stats.errorStudents > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                {stats.errorStudents} lỗi
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("parents")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === "parents"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Phụ huynh ({stats.parents})
            {stats.errorParents > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                {stats.errorParents} lỗi
              </span>
            )}
          </button>
        </div>

        {/* Students table */}
        {activeTab === "students" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {previewData.students.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Không có dữ liệu học sinh
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 text-left">STT</th>
                    <th className="px-3 py-2.5 text-left">Mã HS</th>
                    <th className="px-3 py-2.5 text-left">Họ tên</th>
                    <th className="px-3 py-2.5 text-left">CCCD</th>
                    <th className="px-3 py-2.5 text-left">Lớp</th>
                    <th className="px-3 py-2.5 text-left">Năm học</th>
                    <th className="px-3 py-2.5 text-left">Trạng thái</th>
                    <th className="px-3 py-2.5 text-left">Lỗi</th>
                    <th className="px-3 py-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.students.map((student) => {
                    const isDeleted = deletedRows.has(
                      `student-${student.row_number}`,
                    );
                    return (
                      <tr
                        key={student.row_number}
                        className={`border-t border-slate-100 ${
                          isDeleted
                            ? "bg-rose-50 opacity-50 line-through"
                            : student.has_errors
                              ? "bg-amber-50"
                              : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-400">
                          {student.row_number}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700">
                          {student.student_code || "—"}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {student.full_name || "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600">
                          {student.national_id || (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {student.class_name || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {student.academic_year || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {student.status || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {student.has_errors && student.errors.length > 0 ? (
                            <ul className="space-y-0.5">
                              {student.errors.map((err, i) => (
                                <li key={i} className="text-xs text-amber-700">
                                  • {err}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-emerald-600">✓</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleDelete("student", student.row_number)
                            }
                            className={`text-xs font-medium ${isDeleted ? "text-sky-600 hover:text-sky-800" : "text-rose-500 hover:text-rose-700"}`}
                          >
                            {isDeleted ? "Khôi phục" : "Xóa"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Parents table */}
        {activeTab === "parents" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {previewData.parents.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Không có dữ liệu phụ huynh
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 text-left">STT</th>
                    <th className="px-3 py-2.5 text-left">Mã HS</th>
                    <th className="px-3 py-2.5 text-left">Họ tên PH</th>
                    <th className="px-3 py-2.5 text-left">SĐT</th>
                    <th className="px-3 py-2.5 text-left">Email</th>
                    <th className="px-3 py-2.5 text-left">Quan hệ</th>
                    <th className="px-3 py-2.5 text-left">Lỗi</th>
                    <th className="px-3 py-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.parents.map((parent) => {
                    const isDeleted = deletedRows.has(
                      `parent-${parent.row_number}`,
                    );
                    return (
                      <tr
                        key={parent.row_number}
                        className={`border-t border-slate-100 ${
                          isDeleted
                            ? "bg-rose-50 opacity-50 line-through"
                            : parent.has_errors
                              ? "bg-amber-50"
                              : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-400">
                          {parent.row_number}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700">
                          {parent.student_code || "—"}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {parent.parent_name || "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600">
                          {parent.parent_phone || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {parent.parent_email || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {parent.relation || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {parent.has_errors && parent.errors.length > 0 ? (
                            <ul className="space-y-0.5">
                              {parent.errors.map((err, i) => (
                                <li key={i} className="text-xs text-amber-700">
                                  • {err}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-emerald-600">✓</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleDelete("parent", parent.row_number)
                            }
                            className={`text-xs font-medium ${isDeleted ? "text-sky-600 hover:text-sky-800" : "text-rose-500 hover:text-rose-700"}`}
                          >
                            {isDeleted ? "Khôi phục" : "Xóa"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
