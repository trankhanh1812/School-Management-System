"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { classroomApi } from "@/features/classroom/api";
import chatApi from "./api";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type GroupTypeOption = {
  value: string;
  label: string;
  description: string;
  /** Whether this type auto-adds members (shows sub-options) */
  autoAdd: boolean;
};

function getGroupTypeOptions(role: string, departmentLevel?: number): GroupTypeOption[] {
  const custom: GroupTypeOption = {
    value: "CUSTOM_GROUP",
    label: "Nhóm tùy chỉnh",
    description: "Nhóm tự do, thêm thành viên bất kỳ sau khi tạo",
    autoAdd: false,
  };
  const subjectClass: GroupTypeOption = {
    value: "SUBJECT_CLASS_GROUP",
    label: "Nhóm môn-lớp",
    description: "Nhóm cho môn học bạn đang dạy — thêm thành viên sau khi tạo",
    autoAdd: false,
  };

  if (role === "ADMIN") {
    return [
      { value: "ROLE_GROUP", label: "Nhóm theo vai trò", description: "Tự động thêm toàn bộ giáo viên hoặc phụ huynh trong trường", autoAdd: true },
      { value: "DEPARTMENT_GROUP", label: "Nhóm tổ chuyên môn", description: "Tự động thêm toàn bộ giáo viên trong một tổ bộ môn", autoAdd: true },
      { value: "CLASS_GROUP", label: "Nhóm lớp", description: "Tự động thêm học sinh hoặc phụ huynh của một lớp", autoAdd: true },
      subjectClass,
      custom,
    ];
  }

  if (role === "TEACHER") {
    const opts: GroupTypeOption[] = [];
    if (departmentLevel === 1 || departmentLevel === 2) {
      opts.push({ value: "DEPARTMENT_GROUP", label: "Nhóm tổ chuyên môn", description: "Tự động thêm toàn bộ giáo viên trong tổ bộ môn của bạn", autoAdd: true });
    }
    opts.push(
      { value: "CLASS_GROUP", label: "Nhóm lớp chủ nhiệm", description: "Tự động thêm học sinh hoặc phụ huynh của lớp bạn chủ nhiệm", autoAdd: true },
      subjectClass,
      custom,
    );
    return opts;
  }

  return [];
}

export default function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const { session } = useAuthSession();
  const role = session?.user.role ?? "";
  const departmentLevel = session?.user.departmentLevel;
  const departmentCode = session?.user.departmentCode;

  const typeOptions = getGroupTypeOptions(role, departmentLevel);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState(typeOptions[0]?.value ?? "CUSTOM_GROUP");
  const [description, setDescription] = useState("");

  // Sub-options for auto-add types
  const [roleScope, setRoleScope] = useState<"ROLE_GROUP_TEACHER" | "ROLE_GROUP_PARENT">("ROLE_GROUP_TEACHER");
  const [classScope, setClassScope] = useState<"HOMEROOM_CLASS_GROUP_STUDENT" | "HOMEROOM_CLASS_GROUP_PARENT">("HOMEROOM_CLASS_GROUP_STUDENT");
  const [selectedClassCode, setSelectedClassCode] = useState("");
  const [selectedDeptCode, setSelectedDeptCode] = useState(departmentCode ?? "");
  const [classOptions, setClassOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const selectedOption = typeOptions.find((o) => o.value === groupType);
  const isAutoAdd = selectedOption?.autoAdd ?? false;

  // Load class list when CLASS_GROUP is selected
  useEffect(() => {
    if (groupType !== "CLASS_GROUP") return;
    if (classOptions.length > 0) return;
    setLoadingClasses(true);
    classroomApi.list({ scope: "all", limit: 500 })
      .then((res) => {
        const opts = (res.data ?? [])
          .filter((r) => r.classCode)
          .map((r) => ({
            value: r.classCode!,
            label: `${r.classCode}${r.className && r.className !== r.classCode ? ` — ${r.className}` : ""}${r.academicYear ? ` (${r.academicYear})` : ""}`,
          }));
        setClassOptions(opts);
        if (opts.length > 0 && !selectedClassCode) setSelectedClassCode(opts[0].value);
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, [groupType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setError("");
    setLoading(true);

    try {
      // Determine scope string for backend
      let scope = "custom";
      if (groupType === "ROLE_GROUP") scope = roleScope.toLowerCase();
      else if (groupType === "DEPARTMENT_GROUP") scope = "department_group";
      else if (groupType === "CLASS_GROUP") scope = classScope.toLowerCase();
      else if (groupType === "SUBJECT_CLASS_GROUP") scope = "subject_class_group";

      const group = await chatApi.createGroup({
        groupName: groupName.trim(),
        groupType,
        scope,
        description: description.trim() || undefined,
      });

      if (!group?.id) throw new Error("Không nhận được ID nhóm từ server");

      // Auto-add members for applicable types
      if (isAutoAdd) {
        let autoScope = "";
        let deptCode: string | undefined;
        let classCode: string | undefined;

        if (groupType === "ROLE_GROUP") {
          autoScope = roleScope;
        } else if (groupType === "DEPARTMENT_GROUP") {
          autoScope = "DEPARTMENT_GROUP";
          deptCode = selectedDeptCode || departmentCode;
        } else if (groupType === "CLASS_GROUP") {
          autoScope = classScope;
          classCode = selectedClassCode;
        }

        if (autoScope) {
          await chatApi.autoAddMembers(group.id, autoScope, deptCode, classCode);
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo nhóm");
    } finally {
      setLoading(false);
    }
  };

  if (typeOptions.length === 0) return null;

  return (
    <Modal
      open
      title="Tạo nhóm chat mới"
      onClose={onClose}
      footer={
        <>
          <Button tone="ghost" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)} disabled={loading || !groupName.trim()}>
            {loading ? "Đang tạo..." : "Tạo nhóm"}
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {/* Tên nhóm */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Tên nhóm <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            autoFocus
            placeholder="Nhập tên nhóm..."
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:border-sky-400 focus:outline-none"
          />
        </div>

        {/* Loại nhóm */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Loại nhóm <span className="text-rose-500">*</span>
          </label>
          <div className="grid gap-2">
            {typeOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  groupType === opt.value
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="groupType"
                  value={opt.value}
                  checked={groupType === opt.value}
                  onChange={() => setGroupType(opt.value)}
                  className="mt-0.5 h-4 w-4 accent-sky-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Sub-options: ROLE_GROUP */}
        {groupType === "ROLE_GROUP" ? (
          <div className="grid gap-1.5 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Thêm ai vào nhóm?</p>
            <div className="flex gap-4">
              {(["ROLE_GROUP_TEACHER", "ROLE_GROUP_PARENT"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="roleScope"
                    value={s}
                    checked={roleScope === s}
                    onChange={() => setRoleScope(s)}
                    className="h-4 w-4 accent-sky-600"
                  />
                  {s === "ROLE_GROUP_TEACHER" ? "Toàn bộ giáo viên" : "Toàn bộ phụ huynh"}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {/* Sub-options: DEPARTMENT_GROUP (ADMIN only — teacher uses own dept) */}
        {groupType === "DEPARTMENT_GROUP" && role === "ADMIN" ? (
          <div className="grid gap-1.5 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Mã tổ bộ môn</p>
            <input
              value={selectedDeptCode}
              onChange={(e) => setSelectedDeptCode(e.target.value)}
              placeholder="Ví dụ: TOAN, LY, HOA..."
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-400 focus:outline-none"
            />
          </div>
        ) : null}

        {/* Sub-options: CLASS_GROUP */}
        {groupType === "CLASS_GROUP" ? (
          <div className="grid gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
            <div className="grid gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Thêm ai vào nhóm?</p>
              <div className="flex gap-4">
                {(["HOMEROOM_CLASS_GROUP_STUDENT", "HOMEROOM_CLASS_GROUP_PARENT"] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="classScope"
                      value={s}
                      checked={classScope === s}
                      onChange={() => setClassScope(s)}
                      className="h-4 w-4 accent-sky-600"
                    />
                    {s === "HOMEROOM_CLASS_GROUP_STUDENT" ? "Học sinh" : "Phụ huynh"}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Lớp học</p>
              <select
                value={selectedClassCode}
                onChange={(e) => setSelectedClassCode(e.target.value)}
                disabled={loadingClasses}
                className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-sky-400 focus:outline-none"
              >
                <option value="">{loadingClasses ? "Đang tải..." : "Chọn lớp"}</option>
                {classOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {/* Mô tả */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Mô tả <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Mô tả mục đích nhóm..."
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
