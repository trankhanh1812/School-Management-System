"use client";

import { useEffect, useState } from "react";
import chatApi from "@/features/chat/api";
import { classroomApi } from "@/features/classroom/api";
import { teachingApi } from "@/features/teaching/api";
import { useAuthSession } from "@/hooks/use-auth-session";

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Types allowed per role ────────────────────────────────────────────────────

type GroupTypeOption = {
  value: string;
  label: string;
  description: string;
};

function getAllowedGroupTypes(
  role: string,
  departmentLevel?: number,
): GroupTypeOption[] {
  if (role === "ADMIN") {
    return [
      {
        value: "ROLE_GROUP",
        label: "Nhóm toàn bộ giáo viên",
        description: "Tất cả giáo viên trong trường",
      },
      {
        value: "ROLE_GROUP_PARENT",
        label: "Nhóm toàn bộ phụ huynh",
        description: "Tất cả phụ huynh trong trường",
      },
    ];
  }

  if (role === "TEACHER") {
    const types: GroupTypeOption[] = [];

    // Department Head / Vice Head only
    if (departmentLevel === 1 || departmentLevel === 2) {
      types.push({
        value: "DEPARTMENT_GROUP",
        label: "Nhóm tổ chuyên môn",
        description: "Toàn bộ giáo viên trong bộ môn của bạn",
      });
    }

    // All teachers — homeroom class group
    types.push({
      value: "CLASS_GROUP",
      label: "Nhóm lớp chủ nhiệm",
      description: "Lớp chủ nhiệm + phụ huynh của lớp",
    });

    // All teachers — subject-class group
    types.push({
      value: "SUBJECT_CLASS_GROUP",
      label: "Nhóm môn học – lớp",
      description: "Giáo viên dạy môn + học sinh của lớp đó",
    });

    return types;
  }

  // STUDENT / PARENT: cannot create groups
  return [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateGroupModal({
  onClose,
  onSuccess,
}: CreateGroupModalProps) {
  const { session } = useAuthSession();
  const role = session?.user.role ?? "STUDENT";
  const departmentLevel = session?.user.departmentLevel;
  const departmentCode = session?.user.departmentCode;

  const allowedTypes = getAllowedGroupTypes(role, departmentLevel);

  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [error, setError] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState(allowedTypes[0]?.value ?? "");
  const [description, setDescription] = useState("");

  // Context selectors depending on group type
  const [classOptions, setClassOptions] = useState<{ code: string; name: string }[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<{ code: string; name: string; classCode: string }[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState("");
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(""); // "subjectCode|classCode"

  // Load context data when groupType changes
  useEffect(() => {
    if (!groupType) return;
    setSelectedClassCode("");
    setSelectedSubjectKey("");
    setClassOptions([]);
    setSubjectOptions([]);

    if (groupType === "CLASS_GROUP") {
      // Load homeroom classes for this teacher
      setLoadingContext(true);
      classroomApi
        .list({ scope: "current" })
        .then((res) => {
          const all = res.data ?? [];
          // Filter to classes where this teacher is homeroom
          const homeroom = all.filter(
            (c) =>
              c.homeroomTeacher &&
              session?.user.fullName &&
              c.homeroomTeacher
                .toLowerCase()
                .includes(session.user.fullName.toLowerCase()),
          );
          // If no homeroom match, show all (admin or fallback)
          const list = homeroom.length > 0 ? homeroom : all;
          setClassOptions(
            list.map((c) => ({
              code: c.classCode ?? "",
              name: c.className ?? c.classCode ?? "",
            })),
          );
          if (list[0]?.classCode) setSelectedClassCode(list[0].classCode);
        })
        .catch(() => {/* ignore */})
        .finally(() => setLoadingContext(false));
    }

    if (groupType === "SUBJECT_CLASS_GROUP") {
      // Load teacher's own assignments
      setLoadingContext(true);
      teachingApi
        .listMine()
        .then((res) => {
          const assignments = res.data ?? [];
          const opts = assignments
            .filter((a) => a.subjectCode && a.classCode)
            .map((a) => ({
              code: a.subjectCode ?? "",
              name: a.subjectName ?? a.subjectCode ?? "",
              classCode: a.classCode ?? "",
            }));
          setSubjectOptions(opts);
          if (opts[0]) {
            setSelectedSubjectKey(`${opts[0].code}|${opts[0].classCode}`);
          }
        })
        .catch(() => {/* ignore */})
        .finally(() => setLoadingContext(false));
    }
  }, [groupType, session?.user.fullName]);

  // STUDENT / PARENT: show blocked message
  if (allowedTypes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl mx-4">
          <h2 className="text-base font-bold text-slate-900">Không có quyền tạo nhóm</h2>
          <p className="mt-2 text-sm text-slate-600">
            Học sinh và phụ huynh chỉ có thể tham gia các nhóm được tạo bởi giáo viên hoặc quản trị viên.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Vui lòng nhập tên nhóm.");
      return;
    }

    // Build payload based on group type
    let scope = "";
    let classCode: string | undefined;
    let subjectCode: string | undefined;
    let classMemberCode: string | undefined;

    if (groupType === "ROLE_GROUP") {
      scope = "role_group_teacher";
    } else if (groupType === "ROLE_GROUP_PARENT") {
      scope = "role_group_parent";
    } else if (groupType === "DEPARTMENT_GROUP") {
      scope = `department_group_${departmentCode ?? ""}`;
    } else if (groupType === "CLASS_GROUP") {
      if (!selectedClassCode) {
        setError("Vui lòng chọn lớp chủ nhiệm.");
        return;
      }
      scope = `homeroom_class_group_${selectedClassCode}`;
      classCode = selectedClassCode;
    } else if (groupType === "SUBJECT_CLASS_GROUP") {
      if (!selectedSubjectKey) {
        setError("Vui lòng chọn môn học và lớp.");
        return;
      }
      const [sc, cc] = selectedSubjectKey.split("|");
      scope = `subject_class_group_${sc}_${cc}`;
      subjectCode = sc;
      classMemberCode = cc;
    }

    // Normalize groupType for ROLE_GROUP_PARENT → backend expects ROLE_GROUP
    const backendGroupType =
      groupType === "ROLE_GROUP_PARENT" ? "ROLE_GROUP" : groupType;

    setLoading(true);
    try {
      await chatApi.createGroup({
        groupName: groupName.trim(),
        groupType: backendGroupType,
        scope,
        description: description.trim() || undefined,
        classId: classCode,
        subjectId: subjectCode,
        departmentId: departmentCode,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo nhóm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeInfo = allowedTypes.find((t) => t.value === groupType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl mx-4">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Tạo nhóm chat mới</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Chỉ hiển thị các loại nhóm bạn có quyền tạo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Group type */}
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Loại nhóm *</label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              {allowedTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {selectedTypeInfo && (
              <p className="text-xs text-slate-500">{selectedTypeInfo.description}</p>
            )}
          </div>

          {/* Context selector: CLASS_GROUP → pick homeroom class */}
          {groupType === "CLASS_GROUP" && (
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Lớp chủ nhiệm *</label>
              {loadingContext ? (
                <p className="text-xs text-slate-500">Đang tải danh sách lớp...</p>
              ) : classOptions.length === 0 ? (
                <p className="text-xs text-amber-700 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  Không tìm thấy lớp chủ nhiệm. Bạn cần được phân công làm GVCN để tạo loại nhóm này.
                </p>
              ) : (
                <select
                  value={selectedClassCode}
                  onChange={(e) => setSelectedClassCode(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {classOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Context selector: SUBJECT_CLASS_GROUP → pick subject + class */}
          {groupType === "SUBJECT_CLASS_GROUP" && (
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Môn học – Lớp *</label>
              {loadingContext ? (
                <p className="text-xs text-slate-500">Đang tải phân công giảng dạy...</p>
              ) : subjectOptions.length === 0 ? (
                <p className="text-xs text-amber-700 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  Không tìm thấy phân công giảng dạy. Bạn cần được phân công dạy môn để tạo loại nhóm này.
                </p>
              ) : (
                <select
                  value={selectedSubjectKey}
                  onChange={(e) => setSelectedSubjectKey(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {subjectOptions.map((s) => (
                    <option key={`${s.code}|${s.classCode}`} value={`${s.code}|${s.classCode}`}>
                      {s.name} – {s.classCode}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* DEPARTMENT_GROUP: show which department */}
          {groupType === "DEPARTMENT_GROUP" && departmentCode && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Bộ môn: <span className="font-semibold">{departmentCode}</span>
            </div>
          )}

          {/* Group name */}
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Tên nhóm *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              placeholder="Nhập tên nhóm"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Mô tả (tuỳ chọn)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả mục đích nhóm"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim() || loadingContext}
              className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
