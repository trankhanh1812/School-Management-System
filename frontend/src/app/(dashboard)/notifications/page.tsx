"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageIntro } from "@/features/dashboard/components/page-intro";
import { notificationApi } from "@/features/notification/api";
import type {
  NotificationAudienceClass,
  NotificationCreatePayload,
  NotificationListPayload,
  NotificationRecord,
} from "@/features/notification/types";
import { useAuthSession } from "@/hooks";
import { useToast } from "@/shared/components/toast-provider";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Panel } from "@/shared/ui/panel";

const PAGE_SIZE = 10;

const audienceLabels: Record<NotificationCreatePayload["audience"], string> = {
  all: "Toàn trường",
  admin: "Ban quản trị",
  teacher: "Giáo viên",
  student: "Học sinh",
  parent: "Phụ huynh",
  class: "Theo lớp",
};

const notificationTypeLabels: Record<NotificationCreatePayload["notificationType"], string> = {
  SCORE_UPDATE: "Cập nhật điểm",
  ATTENDANCE: "Chuyên cần",
  SCHEDULE_CHANGE: "Thay đổi lịch",
  EVENT: "Sự kiện",
  ANNOUNCEMENT: "Thông báo chung",
  SYSTEM: "Hệ thống",
};

export default function NotificationsPage() {
  const { session } = useAuthSession();
  const { showToast } = useToast();
  const isAdmin = session?.user.role === "ADMIN";
  const isTeacher = session?.user.role === "TEACHER";
  const canCompose = isAdmin || isTeacher;

  const [pageData, setPageData] = useState<NotificationListPayload>({
    items: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    unreadCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const [page, setPage] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const [audienceClasses, setAudienceClasses] = useState<NotificationAudienceClass[]>([]);
  const [selectedClassCodes, setSelectedClassCodes] = useState<string[]>([]);

  const [draft, setDraft] = useState<NotificationCreatePayload>({
    title: "",
    message: "",
    audience: "all",
    channel: "APP",
    notificationType: "ANNOUNCEMENT",
    classCodes: [],
  });

  const currentItems = pageData.items;
  const unreadCount = pageData.unreadCount;

  function publishUnreadCount(count: number, source = "notifications-page") {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(new CustomEvent("notification-unread-changed", { detail: { count, source } }));
  }

  async function loadNotifications(targetPage = page) {
    setIsLoading(true);
    try {
      const response = await notificationApi.list({
        page: targetPage,
        size: PAGE_SIZE,
        keyword,
        unreadOnly: onlyUnread,
      });
      const data = response.data ?? {
        items: [],
        page: targetPage,
        size: PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
        unreadCount: 0,
      };
      setPageData(data);
      setPage(data.page);
      publishUnreadCount(data.unreadCount);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được thông báo", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAudienceClasses() {
    if (!canCompose) {
      return;
    }

    try {
      const response = await notificationApi.listAudienceClasses();
      setAudienceClasses(response.data ?? []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách lớp nhận thông báo", "error");
    }
  }

  useEffect(() => {
    void loadNotifications(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, onlyUnread]);

  useEffect(() => {
    void loadAudienceClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCompose]);

  useEffect(() => {
    function handleCreatedRefresh() {
      void loadNotifications(0);
    }

    function handleUnreadRefresh(event: Event) {
      const customEvent = event as CustomEvent<{ count?: number; source?: string }>;
      if (customEvent.detail?.source === "NOTIFICATION_CREATED") {
        return;
      }
      if (customEvent.detail?.source === "notifications-page") {
        return;
      }

      void loadNotifications(page);
    }

    window.addEventListener("notification-reload-requested", handleCreatedRefresh);
    window.addEventListener("notification-unread-changed", handleUnreadRefresh);

    return () => {
      window.removeEventListener("notification-reload-requested", handleCreatedRefresh);
      window.removeEventListener("notification-unread-changed", handleUnreadRefresh);
    };
  }, [page, keyword, onlyUnread]);

  useEffect(() => {
    if (draft.audience !== "class") {
      if (selectedClassCodes.length > 0) {
        setSelectedClassCodes([]);
      }
      return;
    }

    setDraft((prev) => ({ ...prev, classCodes: selectedClassCodes }));
  }, [selectedClassCodes, draft.audience]);

  const canGoPrev = useMemo(() => page > 0, [page]);
  const canGoNext = useMemo(() => {
    if (pageData.totalPages <= 0) {
      return false;
    }
    return page < pageData.totalPages - 1;
  }, [page, pageData.totalPages]);

  async function handleCreateNotification() {
    if (!draft.title.trim()) {
      showToast("Vui lòng nhập tiêu đề", "error");
      return;
    }
    if (!draft.message.trim()) {
      showToast("Vui lòng nhập nội dung", "error");
      return;
    }
    if (draft.audience === "class" && selectedClassCodes.length === 0) {
      showToast("Vui lòng chọn ít nhất một lớp", "error");
      return;
    }

    setIsSaving(true);
    try {
      await notificationApi.create({
        ...draft,
        classCodes: draft.audience === "class" ? selectedClassCodes : undefined,
        title: draft.title.trim(),
        message: draft.message.trim(),
      });
      showToast("Đã gửi thông báo", "success");
      setDraft((prev) => ({ ...prev, title: "", message: "", classCodes: [] }));
      setSelectedClassCodes([]);
      await loadNotifications(0);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không gửi được thông báo", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkRead(notificationId: string) {
    try {
      await notificationApi.markRead(notificationId);
      await loadNotifications(page);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được trạng thái", "error");
    }
  }

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      await loadNotifications(page);
      showToast("Đã đánh dấu tất cả là đã đọc", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được thông báo", "error");
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <div className="grid gap-4">
      <PageIntro
        eyebrow="Notifications"
        title="Thông báo hệ thống và giao tiếp nội bộ"
        description="Xem hộp thư thông báo cá nhân, theo dõi trạng thái đã đọc và gửi thông báo theo nhóm đối tượng khi có quyền."
        actions={
          <>
            <ButtonLink href={isAdmin ? "/attendance" : "/students"} tone="secondary">
              {isAdmin ? "Xem chuyên cần" : "Xem học sinh của tôi"}
            </ButtonLink>
            <Button
              onClick={() => {
                setOnlyUnread((prev) => !prev);
                setPage(0);
              }}
              tone="secondary"
            >
              {onlyUnread ? "Hiện tất cả" : "Chỉ chưa đọc"}
            </Button>
          </>
        }
      />

      {canCompose ? (
        <Panel className="p-5 sm:p-6">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-900">Soạn thông báo mới</h3>
            <p className="text-sm text-slate-500">Thông báo sẽ được phân phối theo nhóm người nhận đã chọn.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Đối tượng">
              <select
                value={draft.audience}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, audience: event.target.value as NotificationCreatePayload["audience"] }));
                  setSelectedClassCodes([]);
                }}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {Object.entries(audienceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Loại thông báo">
              <select
                value={draft.notificationType}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, notificationType: event.target.value as NotificationCreatePayload["notificationType"] }))
                }
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                {Object.entries(notificationTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Kênh gửi">
              <select
                value={draft.channel}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, channel: event.target.value as NotificationCreatePayload["channel"] }))
                }
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="APP">App</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </Field>
          </div>

          {draft.audience === "class" ? (
            <div className="mt-3 rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Chọn lớp nhận thông báo</p>
                <div className="flex gap-2">
                  <Button
                    tone="ghost"
                    className="h-8 px-3 text-xs"
                    onClick={() => setSelectedClassCodes(audienceClasses.map((item) => item.classCode))}
                    disabled={audienceClasses.length === 0}
                  >
                    Chọn tất cả
                  </Button>
                  <Button
                    tone="ghost"
                    className="h-8 px-3 text-xs"
                    onClick={() => setSelectedClassCodes([])}
                    disabled={selectedClassCodes.length === 0}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>

              {audienceClasses.length === 0 ? (
                <p className="text-sm text-slate-500">Không có lớp khả dụng để gửi thông báo.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {audienceClasses.map((item) => {
                    const checked = selectedClassCodes.includes(item.classCode);
                    return (
                      <label key={item.classCode} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setSelectedClassCodes((prev) => {
                              const set = new Set(prev);
                              if (event.target.checked) {
                                set.add(item.classCode);
                              } else {
                                set.delete(item.classCode);
                              }
                              return Array.from(set).sort((a, b) => a.localeCompare(b));
                            });
                          }}
                        />
                        <span>{item.classCode} - {item.className}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-3 grid gap-2">
            <Field label="Tiêu đề">
              <input
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
            </Field>

            <Field label="Nội dung">
              <textarea
                value={draft.message}
                onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
                rows={4}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleCreateNotification} disabled={isSaving}>
              {isSaving ? "Đang gửi..." : "Gửi thông báo"}
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Hộp thư thông báo</h3>
            <p className="text-sm text-slate-500">
              {unreadCount} chưa đọc / {pageData.totalElements} tổng thông báo
            </p>
          </div>
          <Button tone="ghost" className="h-8 px-3 text-xs" onClick={handleMarkAllRead} disabled={isMarkingAll || unreadCount === 0}>
            {isMarkingAll ? "Đang cập nhật..." : "Đánh dấu đã đọc tất cả"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung, loại, kênh..."
            className="h-9 min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 text-sm"
          />
          <Button
            tone="secondary"
            className="h-9 px-3 text-xs"
            onClick={() => {
              setPage(0);
              setKeyword(keywordInput.trim());
            }}
          >
            Tìm kiếm
          </Button>
          <Button
            tone="ghost"
            className="h-9 px-3 text-xs"
            onClick={() => {
              setKeywordInput("");
              setKeyword("");
              setPage(0);
            }}
            disabled={!keyword && !keywordInput}
          >
            Xóa từ khóa
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-slate-600">Đang tải thông báo...</div>
        ) : currentItems.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">{onlyUnread ? "Không có thông báo chưa đọc." : "Chưa có thông báo nào."}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentItems.map((item) => (
              <div key={item.notificationId} className={`px-4 py-3 ${item.read ? "bg-white" : "bg-sky-50/40"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {labelForType(item.notificationType)} • {item.channel} • {formatDate(item.sentAt ?? item.createdAt)}
                    </p>
                  </div>
                  {!item.read ? (
                    <Button
                      tone="secondary"
                      className="h-8 px-3 text-xs"
                      onClick={() => {
                        void handleMarkRead(item.notificationId);
                      }}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                      Đã đọc
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm">
          <p className="text-slate-500">
            Trang {pageData.totalElements === 0 ? 0 : page + 1}/{Math.max(pageData.totalPages, 1)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              tone="ghost"
              className="h-8 px-3 text-xs"
              disabled={!canGoPrev || isLoading}
              onClick={() => {
                const target = Math.max(page - 1, 0);
                void loadNotifications(target);
              }}
            >
              Trang trước
            </Button>
            <Button
              tone="ghost"
              className="h-8 px-3 text-xs"
              disabled={!canGoNext || isLoading}
              onClick={() => {
                const target = page + 1;
                void loadNotifications(target);
              }}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function labelForType(value: string) {
  const normalized = value?.toUpperCase?.() ?? "";
  if (normalized in notificationTypeLabels) {
    return notificationTypeLabels[normalized as NotificationCreatePayload["notificationType"]];
  }
  return normalized || "Thông báo";
}

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("vi-VN");
}
