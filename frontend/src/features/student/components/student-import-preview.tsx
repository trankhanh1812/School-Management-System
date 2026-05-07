"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudentImportPreviewResponse } from "@/features/student/api";
import { useToast } from "@/shared/components/toast-provider";
import { ImportPreviewModal } from "@/shared/components/import-preview-modal";

interface StudentImportPreviewProps {
  open: boolean;
  previewData: StudentImportPreviewResponse;
  onImportComplete: () => void;
  onCancel: () => void;
}

export function StudentImportPreview({
  open,
  previewData,
  onImportComplete,
  onCancel,
}: StudentImportPreviewProps) {
  const [editingCell, setEditingCell] = useState<{
    type: "student" | "parent";
    rowIndex: number;
    field: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [students, setStudents] = useState(previewData.students);
  const [parents, setParents] = useState(previewData.parents);
  const [deletedRows, setDeletedRows] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) {
      return;
    }

    setStudents(previewData.students);
    setParents(previewData.parents);
    setDeletedRows(new Set());
    setEditingCell(null);
    setEditingValue("");
  }, [open, previewData]);

  const stats = useMemo(() => {
    const activeStudents = students.filter(
      (s) => !deletedRows.has(`student-${s.row_number}`)
    );
    const activeParents = parents.filter(
      (p) => !deletedRows.has(`parent-${p.row_number}`)
    );
    const validStudents = activeStudents.filter((s) => !s.has_errors).length;
    const validParents = activeParents.filter((p) => !p.has_errors).length;

    return {
      totalActive: activeStudents.length + activeParents.length,
      validCount: validStudents + validParents,
      errorCount: activeStudents.filter((s) => s.has_errors).length + activeParents.filter((p) => p.has_errors).length,
    };
  }, [students, parents, deletedRows]);

  const handleCellClick = (
    type: "student" | "parent",
    rowIndex: number,
    field: string,
    value: string
  ) => {
    setEditingCell({ type, rowIndex, field });
    setEditingValue(value || "");
  };

  const handleCellChange = (newValue: string) => {
    setEditingValue(newValue);

    if (editingCell) {
      const { type, rowIndex, field } = editingCell;

      if (type === "student") {
        const updated = [...students];
        updated[rowIndex] = {
          ...updated[rowIndex],
          [field]: newValue,
        };
        setStudents(updated);
      } else {
        const updated = [...parents];
        updated[rowIndex] = {
          ...updated[rowIndex],
          [field]: newValue,
        };
        setParents(updated);
      }
    }
  };

  const handleDeleteRow = (type: "student" | "parent", rowNumber: number) => {
    setDeletedRows((prev) => {
      const next = new Set(prev);
      next.add(`${type}-${rowNumber}`);
      return next;
    });
  };

  const handleRestoreRow = (type: "student" | "parent", rowNumber: number) => {
    setDeletedRows((prev) => {
      const next = new Set(prev);
      next.delete(`${type}-${rowNumber}`);
      return next;
    });
  };

  const handleImport = async () => {
    if (stats.errorCount > 0) {
      const shouldContinue = window.confirm(
        `Co ${stats.errorCount} hang co loi. Ban chac chan muon nhap tiep?`
      );
      if (!shouldContinue) return;
    }

    setImporting(true);
    try {
      // For now, just proceed with the regular import endpoint
      // In production, you might want to send the edited data back
      showToast(
        `Dang nhap ${stats.validCount} hang du lieu...`,
        "info"
      );

      // Call the actual import after a short delay
      setTimeout(() => {
        onImportComplete();
      }, 1000);
    } finally {
      setImporting(false);
    }
  };

  return (
    <ImportPreviewModal
      open={open}
      title="Preview import danh sách học sinh"
      description="Xem, chỉnh sửa nhanh và loại bỏ các dòng trước khi xác nhận import."
      onClose={onCancel}
      onConfirm={handleImport}
      confirmLabel="Xác nhận import"
      confirmDisabled={importing || stats.totalActive === 0}
      confirmLoading={importing}
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.validCount}</div>
            <div className="text-sm text-gray-600">Hang hop le</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.errorCount}</div>
            <div className="text-sm text-gray-600">Hang co loi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{deletedRows.size}</div>
            <div className="text-sm text-gray-600">Hang da xoa</div>
          </div>
        </div>

      {/* Students Table */}
      {students.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Hoc Sinh ({students.filter((s) => !deletedRows.has(`student-${s.row_number}`)).length})</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">STT</th>
                  <th className="px-3 py-2 text-left">Ma</th>
                  <th className="px-3 py-2 text-left">Ho ten</th>
                  <th className="px-3 py-2 text-left">Lop</th>
                  <th className="px-3 py-2 text-left">Nam hoc</th>
                  <th className="px-3 py-2 text-left">Trang thai</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const isDeleted = deletedRows.has(`student-${student.row_number}`);
                  return (
                    <tr
                      key={`${idx}`}
                      className={`border-b ${
                        isDeleted
                          ? "bg-red-50 opacity-50"
                          : student.has_errors
                            ? "bg-yellow-50"
                            : ""
                      }`}
                    >
                      <td className="px-3 py-2">{student.row_number}</td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                        onClick={() =>
                          handleCellClick(
                            "student",
                            idx,
                            "student_code",
                            student.student_code || ""
                          )
                        }
                      >
                        {student.student_code || "-"}
                      </td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100 font-medium"
                        onClick={() =>
                          handleCellClick(
                            "student",
                            idx,
                            "full_name",
                            student.full_name || ""
                          )
                        }
                      >
                        {student.full_name}
                      </td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                        onClick={() =>
                          handleCellClick(
                            "student",
                            idx,
                            "class_name",
                            student.class_name || ""
                          )
                        }
                      >
                        {student.class_name}
                      </td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                        onClick={() =>
                          handleCellClick(
                            "student",
                            idx,
                            "academic_year",
                            student.academic_year || ""
                          )
                        }
                      >
                        {student.academic_year}
                      </td>
                      <td className="px-3 py-2">{student.status || "-"}</td>
                      <td className="px-3 py-2 text-center">
                        {student.has_errors && (
                          <span className="inline-block bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded mr-2">
                            ⚠️ {student.errors.length}
                          </span>
                        )}
                        {isDeleted ? (
                          <button
                            onClick={() =>
                              handleRestoreRow("student", student.row_number)
                            }
                            className="text-blue-600 text-xs hover:underline"
                          >
                            Phuc hoi
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleDeleteRow("student", student.row_number)
                            }
                            className="text-red-600 text-xs hover:underline"
                          >
                            Xoa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parents Table */}
      {parents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Phu Huynh ({parents.filter((p) => !deletedRows.has(`parent-${p.row_number}`)).length})</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">STT</th>
                  <th className="px-3 py-2 text-left">Ma HS</th>
                  <th className="px-3 py-2 text-left">Ho ten</th>
                  <th className="px-3 py-2 text-left">SDT</th>
                  <th className="px-3 py-2 text-left">Quan he</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent, idx) => {
                  const isDeleted = deletedRows.has(`parent-${parent.row_number}`);
                  return (
                    <tr
                      key={`${idx}`}
                      className={`border-b ${
                        isDeleted
                          ? "bg-red-50 opacity-50"
                          : parent.has_errors
                            ? "bg-yellow-50"
                            : ""
                      }`}
                    >
                      <td className="px-3 py-2">{parent.row_number}</td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                        onClick={() =>
                          handleCellClick(
                            "parent",
                            idx,
                            "student_code",
                            parent.student_code || ""
                          )
                        }
                      >
                        {parent.student_code || "-"}
                      </td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100 font-medium"
                        onClick={() =>
                          handleCellClick(
                            "parent",
                            idx,
                            "parent_name",
                            parent.parent_name || ""
                          )
                        }
                      >
                        {parent.parent_name}
                      </td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                        onClick={() =>
                          handleCellClick(
                            "parent",
                            idx,
                            "parent_phone",
                            parent.parent_phone || ""
                          )
                        }
                      >
                        {parent.parent_phone}
                      </td>
                      <td
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                        onClick={() =>
                          handleCellClick(
                            "parent",
                            idx,
                            "relation",
                            parent.relation || ""
                          )
                        }
                      >
                        {parent.relation}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {parent.has_errors && (
                          <span className="inline-block bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded mr-2">
                            ⚠️ {parent.errors.length}
                          </span>
                        )}
                        {isDeleted ? (
                          <button
                            onClick={() =>
                              handleRestoreRow("parent", parent.row_number)
                            }
                            className="text-blue-600 text-xs hover:underline"
                          >
                            Phuc hoi
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleDeleteRow("parent", parent.row_number)
                            }
                            className="text-red-600 text-xs hover:underline"
                          >
                            Xoa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cell Edit Dialog (inline) */}
      {editingCell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">
              Chinh sua: {editingCell.field}
            </h4>
            <input
              type="text"
              value={editingValue}
              onChange={(e) => handleCellChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditingCell(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Dong
              </button>
              <button
                onClick={() => {
                  setEditingCell(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Luu
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </ImportPreviewModal>
  );
}
