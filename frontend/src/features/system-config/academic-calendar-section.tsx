"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/api-client";
import type { ApiResponse } from "@/types/api";
import { Button } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useToast } from "@/shared/components/toast-provider";

type AcademicYear = {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
};

type Semester = {
  id: string;
  code: string;
  academicYearCode: string;
  startDate: string;
  endDate: string;
  status: string;
  locked: boolean;
};

type YearForm = {
  code: string;
  startDate: string;
  endDate: string;
  status: string;
};
type SemForm = {
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  isLocked: boolean;
};

const EMPTY_YEAR: YearForm = {
  code: "",
  startDate: "",
  endDate: "",
  status: "INACTIVE",
};
const EMPTY_SEM: SemForm = {
  code: "",
  startDate: "",
  endDate: "",
  status: "INACTIVE",
  isLocked: false,
};

export function AcademicCalendarSection() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const isAdmin = session?.user.role === "ADMIN";

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [yearEditing, setYearEditing] = useState<"new" | string | null>(null);
  const [yearForm, setYearForm] = useState<YearForm>(EMPTY_YEAR);
  const [semEditing, setSemEditing] = useState<"new" | string | null>(null);
  const [semForm, setSemForm] = useState<SemForm>(EMPTY_SEM);
  const [saving, setSaving] = useState(false);

  const loadYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<AcademicYear[]>>(
        "/academic-calendar/years",
        { authenticated: true },
      );
      const list = Array.isArray(res.data) ? res.data : [];
      setYears(list);
      setSelectedYear((prev) => prev || list[0]?.code || "");
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSemesters = useCallback(async (yearCode: string) => {
    if (!yearCode) {
      setSemesters([]);
      return;
    }
    try {
      const res = await apiClient.get<ApiResponse<Semester[]>>(
        `/academic-calendar/semesters?academicYearCode=${encodeURIComponent(yearCode)}`,
        { authenticated: true },
      );
      setSemesters(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSemesters([]);
    }
  }, []);

  useEffect(() => {
    void loadYears();
  }, [loadYears]);
  useEffect(() => {
    void loadSemesters(selectedYear);
  }, [selectedYear, loadSemesters]);

  // ── Year handlers ──────────────────────────────────────────────────────────
  function startCreateYear() {
    setYearEditing("new");
    setYearForm(EMPTY_YEAR);
  }
  function startEditYear(y: AcademicYear) {
    setYearEditing(y.code);
    setYearForm({
      code: y.code,
      startDate: y.startDate,
      endDate: y.endDate,
      status: y.status || "INACTIVE",
    });
  }
  function cancelYear() {
    setYearEditing(null);
    setYearForm(EMPTY_YEAR);
  }

  async function saveYear() {
    if (!yearForm.code.trim()) {
      showToast("Vui lòng nhập mã năm học.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(
        "/academic-calendar/years",
        {
          code: yearForm.code.trim(),
          startDate: yearForm.startDate || null,
          endDate: yearForm.endDate || null,
          status: yearForm.status,
        },
        { authenticated: true },
      );
      showToast("Đã lưu năm học.", "success");
      cancelYear();
      await loadYears();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không lưu được năm học.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function activateYear(code: string) {
    try {
      await apiClient.put(
        `/academic-calendar/years/${encodeURIComponent(code)}/activate`,
        {},
        { authenticated: true },
      );
      showToast(`Đã đặt năm học ${code} là hiện hành.`, "success");
      await loadYears();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không đặt được năm hiện hành.",
        "error",
      );
    }
  }

  // ── Semester handlers ────────────────────────────────────────────────────────
  function startCreateSem() {
    setSemEditing("new");
    setSemForm(EMPTY_SEM);
  }
  function startEditSem(s: Semester) {
    setSemEditing(s.code);
    setSemForm({
      code: s.code,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status || "INACTIVE",
      isLocked: s.locked,
    });
  }
  function cancelSem() {
    setSemEditing(null);
    setSemForm(EMPTY_SEM);
  }

  async function saveSem() {
    if (!selectedYear) {
      showToast("Chọn năm học trước.", "error");
      return;
    }
    if (!semForm.code.trim()) {
      showToast("Vui lòng nhập mã học kỳ.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(
        "/academic-calendar/semesters",
        {
          academicYearCode: selectedYear,
          code: semForm.code.trim(),
          startDate: semForm.startDate || null,
          endDate: semForm.endDate || null,
          status: semForm.status,
          isLocked: semForm.isLocked,
        },
        { authenticated: true },
      );
      showToast("Đã lưu học kỳ.", "success");
      cancelSem();
      await loadSemesters(selectedYear);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không lưu được học kỳ.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function activateSem(code: string) {
    try {
      await apiClient.put(
        `/academic-calendar/semesters/${encodeURIComponent(code)}/activate?academicYearCode=${encodeURIComponent(selectedYear)}`,
        {},
        { authenticated: true },
      );
      showToast(`Đã đặt học kỳ ${code} là hiện hành.`, "success");
      await loadSemesters(selectedYear);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không đặt được học kỳ hiện hành.",
        "error",
      );
    }
  }

  return (
    <Panel className="p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          Năm học & Học kỳ
        </h3>
        <p className="text-sm text-slate-500">
          Tạo và quản lý năm học, học kỳ. Đặt năm học / học kỳ hiện hành và khóa
          học kỳ khi kết thúc.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Years */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">Năm học</h4>
              {isAdmin && (
                <Button
                  tone="secondary"
                  onClick={startCreateYear}
                  disabled={yearEditing !== null}
                >
                  + Thêm năm học
                </Button>
              )}
            </div>

            {yearEditing !== null && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 grid gap-3">
                <p className="text-sm font-semibold text-sky-800">
                  {yearEditing === "new"
                    ? "Thêm năm học"
                    : `Chỉnh sửa ${yearEditing}`}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Mã năm học *">
                    <input
                      value={yearForm.code}
                      disabled={yearEditing !== "new"}
                      onChange={(e) =>
                        setYearForm((f) => ({ ...f, code: e.target.value }))
                      }
                      placeholder="VD: 2026-2027"
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-100"
                    />
                  </Field>
                  <Field label="Trạng thái">
                    <select
                      value={yearForm.status}
                      onChange={(e) =>
                        setYearForm((f) => ({ ...f, status: e.target.value }))
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    >
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ACTIVE">ACTIVE</option>
                    </select>
                  </Field>
                  <Field label="Ngày bắt đầu">
                    <input
                      type="date"
                      value={yearForm.startDate}
                      onChange={(e) =>
                        setYearForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    />
                  </Field>
                  <Field label="Ngày kết thúc">
                    <input
                      type="date"
                      value={yearForm.endDate}
                      onChange={(e) =>
                        setYearForm((f) => ({ ...f, endDate: e.target.value }))
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void saveYear()} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                  <Button
                    tone="secondary"
                    onClick={cancelYear}
                    disabled={saving}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Mã
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Thời gian
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Trạng thái
                    </th>
                    {isAdmin && (
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">
                        Thao tác
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {years.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-slate-500">
                        Chưa có năm học nào.
                      </td>
                    </tr>
                  ) : (
                    years.map((y) => (
                      <tr
                        key={y.id || y.code}
                        className={`border-b border-slate-100 hover:bg-slate-50 ${selectedYear === y.code ? "bg-sky-50/60" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setSelectedYear(y.code)}
                            className="font-mono text-xs font-semibold text-sky-700 hover:underline"
                          >
                            {y.code}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {y.startDate || "—"} → {y.endDate || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={y.status} />
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <ActionBtn
                                onClick={() => startEditYear(y)}
                                disabled={yearEditing !== null}
                              >
                                Sửa
                              </ActionBtn>
                              {y.status !== "ACTIVE" && (
                                <ActionBtn
                                  onClick={() => void activateYear(y.code)}
                                >
                                  Đặt hiện hành
                                </ActionBtn>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Semesters */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">
                Học kỳ {selectedYear ? `— ${selectedYear}` : ""}
              </h4>
              {isAdmin && (
                <Button
                  tone="secondary"
                  onClick={startCreateSem}
                  disabled={semEditing !== null || !selectedYear}
                >
                  + Thêm học kỳ
                </Button>
              )}
            </div>

            {!selectedYear ? (
              <p className="text-sm text-slate-500">
                Chọn một năm học ở bảng bên trái để xem/quản lý học kỳ.
              </p>
            ) : (
              <>
                {semEditing !== null && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 grid gap-3">
                    <p className="text-sm font-semibold text-sky-800">
                      {semEditing === "new"
                        ? "Thêm học kỳ"
                        : `Chỉnh sửa ${semEditing}`}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Mã học kỳ *">
                        <input
                          value={semForm.code}
                          disabled={semEditing !== "new"}
                          onChange={(e) =>
                            setSemForm((f) => ({ ...f, code: e.target.value }))
                          }
                          placeholder="VD: HK1"
                          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-100"
                        />
                      </Field>
                      <Field label="Trạng thái">
                        <select
                          value={semForm.status}
                          onChange={(e) =>
                            setSemForm((f) => ({
                              ...f,
                              status: e.target.value,
                            }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                        >
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="ACTIVE">ACTIVE</option>
                        </select>
                      </Field>
                      <Field label="Ngày bắt đầu">
                        <input
                          type="date"
                          value={semForm.startDate}
                          onChange={(e) =>
                            setSemForm((f) => ({
                              ...f,
                              startDate: e.target.value,
                            }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                        />
                      </Field>
                      <Field label="Ngày kết thúc">
                        <input
                          type="date"
                          value={semForm.endDate}
                          onChange={(e) =>
                            setSemForm((f) => ({
                              ...f,
                              endDate: e.target.value,
                            }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                        />
                      </Field>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={semForm.isLocked}
                        onChange={(e) =>
                          setSemForm((f) => ({
                            ...f,
                            isLocked: e.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      Khóa học kỳ (không cho sửa điểm / lịch)
                    </label>
                    <div className="flex gap-2">
                      <Button onClick={() => void saveSem()} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                      </Button>
                      <Button
                        tone="secondary"
                        onClick={cancelSem}
                        disabled={saving}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">
                          Mã
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">
                          Thời gian
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">
                          Trạng thái
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">
                          Khóa
                        </th>
                        {isAdmin && (
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">
                            Thao tác
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {semesters.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-3 text-slate-500">
                            Chưa có học kỳ nào cho năm này.
                          </td>
                        </tr>
                      ) : (
                        semesters.map((s) => (
                          <tr
                            key={s.id || s.code}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-3 py-2 font-mono text-xs text-slate-700">
                              {s.code}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {s.startDate || "—"} → {s.endDate || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {s.locked ? "🔒" : "—"}
                            </td>
                            {isAdmin && (
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <ActionBtn
                                    onClick={() => startEditSem(s)}
                                    disabled={semEditing !== null}
                                  >
                                    Sửa
                                  </ActionBtn>
                                  {s.status !== "ACTIVE" && (
                                    <ActionBtn
                                      onClick={() => void activateSem(s.code)}
                                    >
                                      Đặt hiện hành
                                    </ActionBtn>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
    >
      {active ? "Hiện hành" : status || "INACTIVE"}
    </span>
  );
}

function ActionBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40"
    >
      {children}
    </button>
  );
}
