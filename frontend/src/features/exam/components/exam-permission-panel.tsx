"use client";

import { useCallback, useEffect, useState } from "react";
import { examPermissionApi, type ExamPermissionRecord } from "@/features/exam/exam-permission-api";
import { classroomApi, type ClassStudentApiRecord } from "@/features/classroom/api";
import { useToast } from "@/shared/components/toast-provider";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

type Props = {
  examId: string;
  examTitle: string;
  classCodes: string[];
};

export function ExamPermissionPanel({ examId, examTitle, classCodes }: Props) {
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<ExamPermissionRecord[]>([]);
  const [students, setStudents] = useState<ClassStudentApiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState(classCodes[0] ?? "");

  const loadPermissions = useCallback(async () => {
    if (!examId) return;
    setIsLoading(true);
    try {
      const res = await examPermissionApi.listByExam(examId);
      setPermissions(res.data ?? []);
    } catch {/* ignore */}
    finally { setIsLoading(false); }
  }, [examId]);

  const loadStudents = useCallback(async (classCode: string) => {
    if (!classCode) return;
    try {
      const res = await classroomApi.students(classCode);
      setStudents(res.data ?? []);
    } catch {/* ignore */}
  }, []);

  useEffect(() => { void loadPermissions(); }, [loadPermissions]);
  useEffect(() => { if (selectedClass) void loadStudents(selectedClass); }, [selectedClass, loadStudents]);

  const getPermission = (studentCode: string) =>
    permissions.find((p) => p.studentCode === studentCode);

  async function handleToggle(studentCode: string, currentAllowed: boolean | undefined) {
    // If no record → create with isAllowed=false (cấm thi)
    // If exists → toggle
    const newAllowed = currentAllowed === false ? true : false;
    setSaving(studentCode);
    try {
      await examPermissionApi.upsert({
        examId,
        studentCode,
        isAllowed: newAllowed,
        reason: newAllowed ? undefined : "Không đủ điều kiện dự thi",
      });
      await loadPermissions();
      showToast(
        newAllowed ? `Đã cho phép ${studentCode} dự thi.` : `Đã cấm ${studentCode} dự thi.`,
        "success",
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể cập nhật.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(id: string) {
    setSaving(id);
    try {
      await examPermissionApi.delete(id);
      await loadPermissions();
      showToast("Đã xóa quy định thi.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xóa.", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Quyền dự thi</h3>
          <p className="text-sm text-slate-500">
            Mặc định tất cả học sinh được dự thi. Chỉ cần thiết lập khi cần cấm hoặc ghi chú đặc biệt.
          </p>
        </div>
        {classCodes.length > 1 && (
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
          >
            {classCodes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-500">Chọn lớp để xem danh sách học sinh.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Học sinh</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Trạng thái</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Lý do</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const perm = getPermission(s.studentCode ?? "");
                const isBanned = perm?.isAllowed === false;
                const isAllowed = perm?.isAllowed === true;
                return (
                  <tr key={s.studentCode} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900">{s.fullName}</p>
                      <p className="text-xs text-slate-500">{s.studentCode}</p>
                    </td>
                    <td className="px-3 py-2">
                      {isBanned ? (
                        <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                          Bị cấm thi
                        </span>
                      ) : isAllowed ? (
                        <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Được phép (ghi chú)
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Mặc định (được thi)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs max-w-xs">
                      {perm?.reason || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleToggle(s.studentCode ?? "", perm?.isAllowed)}
                          disabled={saving === s.studentCode}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                            isBanned
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          {saving === s.studentCode ? "..." : isBanned ? "Bỏ cấm" : "Cấm thi"}
                        </button>
                        {perm?.id && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(perm.id!)}
                            disabled={saving === perm.id}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
