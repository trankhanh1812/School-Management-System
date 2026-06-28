"use client";

import { useCallback, useEffect, useState } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { useAuthSession } from "@/hooks/use-auth-session";
import { systemConfigApi } from "@/features/system-config/api";
import { apiClient } from "@/lib/api/api-client";
import type { SystemSettingsRecord } from "@/features/system-config/types";
import type { ApiResponse } from "@/types/api";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { Modal } from "@/shared/ui/modal";
import { useToast } from "@/shared/components/toast-provider";

const DEFAULT_SETTINGS: SystemSettingsRecord = {
  allowedSchoolIps: ["192.168.1.0/24"],
  oralWeight: 1,
  quiz15Weight: 1,
  onePeriodWeight: 2,
  midtermWeight: 3,
  finalWeight: 3,
  scoreEditWindowDays: 3,
  requireAdminApproval: true,
};

type SettingsModal = "ips" | "weights" | "window" | "approval" | null;

export default function SystemSettingsPage() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const isAdmin = session?.user.role === "ADMIN";

  const [settings, setSettings] = useState<SystemSettingsRecord>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<SystemSettingsRecord>(DEFAULT_SETTINGS);
  const [activeModal, setActiveModal] = useState<SettingsModal>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!isAdmin) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await systemConfigApi.get();
        const payload = response.data;
        if (!payload) {
          setSettings(DEFAULT_SETTINGS);
          setDraft(DEFAULT_SETTINGS);
          return;
        }
        setSettings(payload);
        setDraft(payload);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Không tải được cấu hình", "error");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, [isAdmin, showToast]);

  if (!isAdmin) {
    return (
      <Panel className="p-6 text-sm text-rose-700">
        Bạn không có quyền truy cập màn hình cấu hình hệ thống.
      </Panel>
    );
  }

  const totalWeight = settings.oralWeight + settings.quiz15Weight + settings.onePeriodWeight + settings.midtermWeight + settings.finalWeight;

  function openModal(modal: Exclude<SettingsModal, null>) {
    setDraft(settings);
    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
  }

  function updateDraft<K extends keyof SystemSettingsRecord>(key: K, value: SystemSettingsRecord[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(modal: Exclude<SettingsModal, null>) {
    const payload = buildPayloadForModal(modal, settings, draft);

    setIsSaving(true);
    try {
      const response = await systemConfigApi.update(payload);
      const next = response.data;
      if (next) {
        setSettings(next);
        setDraft(next);
      }
      showToast("Đã lưu cấu hình hệ thống", "success");
      closeModal();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không lưu được cấu hình", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="System"
        title="Cấu hình hệ thống"
        description="Cấu hình IP mạng trường, trọng số đầu điểm, thời gian cho phép sửa điểm sau công bố và các chính sách toàn cục."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ConfigCard
          title="Danh sách IP mạng trường"
          description="Dùng để kiểm tra IP khi học sinh quét QR điểm danh."
          summary={`${settings.allowedSchoolIps.length} IP / CIDR`}
          value={settings.allowedSchoolIps.length > 0 ? settings.allowedSchoolIps.join(", ") : "Chưa cấu hình"}
          actionLabel="Chỉnh sửa IP"
          onAction={() => openModal("ips")}
        />

        <ConfigCard
          title="Trọng số đầu điểm"
          description="Áp dụng cho các loại điểm tính trung bình môn."
          summary={`Tổng hệ số: ${totalWeight.toFixed(1)}`}
          value={`Miệng ${settings.oralWeight} · 15 phút ${settings.quiz15Weight} · 1 tiết ${settings.onePeriodWeight} · Giữa kỳ ${settings.midtermWeight} · Cuối kỳ ${settings.finalWeight}`}
          actionLabel="Chỉnh sửa trọng số"
          onAction={() => openModal("weights")}
        />

        <ConfigCard
          title="Thời gian sửa điểm"
          description="Số ngày cho phép chỉnh sửa điểm sau khi công bố."
          summary={`${settings.scoreEditWindowDays} ngày`}
          value="Sau thời gian này, điểm sẽ tự động khóa."
          actionLabel="Chỉnh sửa thời gian"
          onAction={() => openModal("window")}
        />

        <ConfigCard
          title="Phê duyệt công bố điểm"
          description="Bật / tắt yêu cầu ADMIN duyệt trước khi công bố."
          summary={settings.requireAdminApproval ? "Đang bật" : "Đang tắt"}
          value={settings.requireAdminApproval ? "Bắt buộc ADMIN phê duyệt trước khi công bố điểm." : "Giáo viên có thể công bố trực tiếp."}
          actionLabel="Chỉnh sửa quy tắc"
          onAction={() => openModal("approval")}
        />
      </div>

      <Panel className="p-5 sm:p-6">
        {isLoading ? (
          <p className="text-sm text-slate-600">Đang tải cấu hình...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <InfoTile label="IP mạng trường" value={settings.allowedSchoolIps.join(" · ")} />
            <InfoTile label="Tổng trọng số" value={totalWeight.toFixed(1)} />
            <InfoTile label="Phê duyệt" value={settings.requireAdminApproval ? "Bắt buộc" : "Không bắt buộc"} />
          </div>
        )}
      </Panel>

      <Modal
        open={activeModal === "ips"}
        title="Cấu hình IP mạng trường"
        description="Nhập từng IP hoặc CIDR trên một dòng. Danh sách này sẽ được dùng để xác thực quét QR điểm danh."
        onClose={closeModal}
        footer={
          <>
            <Button tone="secondary" onClick={closeModal} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave("ips")} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="text-sm font-semibold text-slate-800">Danh sách IP / CIDR</label>
          <textarea
            value={draft.allowedSchoolIps.join("\n")}
            onChange={(event) =>
              updateDraft(
                "allowedSchoolIps",
                event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            className="min-h-44 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>
      </Modal>

      <Modal
        open={activeModal === "weights"}
        title="Cấu hình trọng số đầu điểm"
        description="Mỗi loại điểm sẽ có trọng số riêng. Dùng nút lưu để áp dụng cho toàn hệ thống."
        onClose={closeModal}
        size="lg"
        footer={
          <>
            <Button tone="secondary" onClick={closeModal} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave("weights")} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WeightInput label="Điểm miệng" value={draft.oralWeight} onChange={(value) => updateDraft("oralWeight", value)} />
          <WeightInput label="Điểm 15 phút" value={draft.quiz15Weight} onChange={(value) => updateDraft("quiz15Weight", value)} />
          <WeightInput label="Điểm 1 tiết" value={draft.onePeriodWeight} onChange={(value) => updateDraft("onePeriodWeight", value)} />
          <WeightInput label="Điểm giữa kỳ" value={draft.midtermWeight} onChange={(value) => updateDraft("midtermWeight", value)} />
          <WeightInput label="Điểm cuối kỳ" value={draft.finalWeight} onChange={(value) => updateDraft("finalWeight", value)} />
        </div>

        <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Tổng hệ số hiện tại: <span className="font-semibold">{(draft.oralWeight + draft.quiz15Weight + draft.onePeriodWeight + draft.midtermWeight + draft.finalWeight).toFixed(1)}</span>
        </div>
      </Modal>

      <Modal
        open={activeModal === "window"}
        title="Cấu hình thời gian sửa điểm"
        description="Sau số ngày này kể từ lúc công bố, điểm sẽ bị khóa và không sửa được nữa."
        onClose={closeModal}
        footer={
          <>
            <Button tone="secondary" onClick={closeModal} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave("window")} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </>
        }
      >
        <div className="grid max-w-sm gap-3">
          <label className="text-sm font-semibold text-slate-800">Số ngày được sửa</label>
          <input
            type="number"
            min={0}
            max={90}
            value={draft.scoreEditWindowDays}
            onChange={(event) => updateDraft("scoreEditWindowDays", Number(event.target.value) || 0)}
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
          />
        </div>
      </Modal>

      <Modal
        open={activeModal === "approval"}
        title="Cấu hình phê duyệt công bố điểm"
        description="Bật nếu muốn ADMIN duyệt trước khi công bố chính thức. Tắt nếu giáo viên có thể công bố trực tiếp."
        onClose={closeModal}
        footer={
          <>
            <Button tone="secondary" onClick={closeModal} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave("approval")} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </>
        }
      >
        <label className="inline-flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={draft.requireAdminApproval}
            onChange={(event) => updateDraft("requireAdminApproval", event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block font-semibold text-slate-900">Bắt buộc ADMIN phê duyệt</span>
            <span className="mt-1 block text-slate-600">Khi bật, giáo viên chỉ được submit; ADMIN là người duyệt và công bố.</span>
          </span>
        </label>
      </Modal>

      <AcademicRankRulesSection />
    </div>
  );
}

function buildPayloadForModal(modal: Exclude<SettingsModal, null>, current: SystemSettingsRecord, draft: SystemSettingsRecord): SystemSettingsRecord {
  switch (modal) {
    case "ips":
      return {
        ...current,
        allowedSchoolIps: draft.allowedSchoolIps.map((item) => item.trim()).filter(Boolean),
      };
    case "weights":
      return {
        ...current,
        oralWeight: draft.oralWeight,
        quiz15Weight: draft.quiz15Weight,
        onePeriodWeight: draft.onePeriodWeight,
        midtermWeight: draft.midtermWeight,
        finalWeight: draft.finalWeight,
      };
    case "window":
      return {
        ...current,
        scoreEditWindowDays: draft.scoreEditWindowDays,
      };
    case "approval":
      return {
        ...current,
        requireAdminApproval: draft.requireAdminApproval,
      };
    default:
      return current;
  }
}

function ConfigCard({
  title,
  description,
  summary,
  value,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  summary: string;
  value: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">{summary}</span>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            {value}
          </div>
        </div>

        <div className="flex justify-end">
          <Button tone="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function WeightInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <input
        type="number"
        min={0}
        step={0.1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
      />
    </div>
  );
}

// ─── Academic Rank Rules Section ─────────────────────────────────────────────

type RankRule = {
  id: string;
  code: string;
  name: string;
  minAverage: number;
  maxFailedSubjects: number;
  minConductLevel: string;
  appliesToGrade: number;
};

const EMPTY_RULE: Omit<RankRule, "id"> = {
  code: "",
  name: "",
  minAverage: 5.0,
  maxFailedSubjects: 0,
  minConductLevel: "",
  appliesToGrade: 0,
};

const CONDUCT_LEVELS = ["", "Yếu", "Trung bình", "Khá", "Tốt"];

function AcademicRankRulesSection() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const isAdmin = session?.user.role === "ADMIN";

  const [rules, setRules] = useState<RankRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<RankRule, "id">>(EMPTY_RULE);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<RankRule[]>>("/academic-rank-rules", { authenticated: true });
      setRules(Array.isArray(res.data) ? res.data : []);
    } catch {/* ignore */}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startEdit(rule: RankRule) {
    setEditingId(rule.id);
    setForm({
      code: rule.code,
      name: rule.name,
      minAverage: rule.minAverage,
      maxFailedSubjects: rule.maxFailedSubjects,
      minConductLevel: rule.minConductLevel,
      appliesToGrade: rule.appliesToGrade,
    });
  }

  function startCreate() {
    setEditingId("new");
    setForm(EMPTY_RULE);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_RULE);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      showToast("Vui lòng nhập mã và tên quy tắc.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        minAverage: form.minAverage,
        maxFailedSubjects: form.maxFailedSubjects || 0,
        minConductLevel: form.minConductLevel || null,
        appliesToGrade: form.appliesToGrade || null,
      };
      if (editingId === "new") {
        await apiClient.post("/academic-rank-rules", payload, { authenticated: true });
        showToast("Đã tạo quy tắc xếp loại.", "success");
      } else {
        await apiClient.put(`/academic-rank-rules/${editingId}`, payload, { authenticated: true });
        showToast("Đã cập nhật quy tắc xếp loại.", "success");
      }
      cancelEdit();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xóa quy tắc xếp loại này?")) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/academic-rank-rules/${id}`, { authenticated: true });
      showToast("Đã xóa quy tắc.", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể xóa.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Quy tắc xếp loại học lực</h3>
          <p className="text-sm text-slate-500">
            Định nghĩa điều kiện xếp loại Giỏi/Khá/Trung bình/Yếu. Dùng trong tính toán xét lên lớp tự động.
          </p>
        </div>
        {isAdmin && (
          <Button tone="secondary" onClick={startCreate} disabled={editingId !== null}>
            + Thêm quy tắc
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : (
        <div className="grid gap-3">
          {/* Edit / Create form */}
          {editingId !== null && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 grid gap-3">
              <p className="text-sm font-semibold text-sky-800">
                {editingId === "new" ? "Thêm quy tắc mới" : "Chỉnh sửa quy tắc"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Mã *</label>
                  <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="VD: GIOI" className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Tên *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Giỏi" className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Điểm TB tối thiểu</label>
                  <input type="number" min={0} max={10} step={0.1} value={form.minAverage}
                    onChange={(e) => setForm((f) => ({ ...f, minAverage: Number(e.target.value) }))}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Số môn dưới 5 tối đa</label>
                  <input type="number" min={0} value={form.maxFailedSubjects}
                    onChange={(e) => setForm((f) => ({ ...f, maxFailedSubjects: Number(e.target.value) }))}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Hạnh kiểm tối thiểu</label>
                  <select value={form.minConductLevel}
                    onChange={(e) => setForm((f) => ({ ...f, minConductLevel: e.target.value }))}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm">
                    {CONDUCT_LEVELS.map((l) => (
                      <option key={l} value={l}>{l || "Không yêu cầu"}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Áp dụng khối (0 = tất cả)</label>
                  <input type="number" min={0} max={12} value={form.appliesToGrade}
                    onChange={(e) => setForm((f) => ({ ...f, appliesToGrade: Number(e.target.value) }))}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
                <Button tone="secondary" onClick={cancelEdit} disabled={saving}>Hủy</Button>
              </div>
            </div>
          )}

          {/* Rules table */}
          {rules.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có quy tắc nào. Thêm quy tắc để hệ thống tự động xếp loại học lực.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Mã</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Tên</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">TB tối thiểu</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Môn dưới 5 tối đa</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">HK tối thiểu</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Khối</th>
                    {isAdmin && <th className="px-3 py-2 text-left font-semibold text-slate-700">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">{r.code}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{r.name}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{r.minAverage}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{r.maxFailedSubjects}</td>
                      <td className="px-3 py-2 text-slate-600">{r.minConductLevel || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{r.appliesToGrade ? `Khối ${r.appliesToGrade}` : "Tất cả"}</td>
                      {isAdmin && (
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => startEdit(r)} disabled={editingId !== null}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40">
                              Sửa
                            </button>
                            <button type="button" onClick={() => void handleDelete(r.id)} disabled={deletingId === r.id}
                              className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition disabled:opacity-40">
                              {deletingId === r.id ? "..." : "Xóa"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
