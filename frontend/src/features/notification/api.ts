import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";
import type {
  NotificationAudienceClass,
  NotificationCreatePayload,
  NotificationListPayload,
  NotificationRecord,
  NotificationUnreadCountPayload,
} from "@/features/notification/types";

export const notificationApi = {
  list(params?: { page?: number; size?: number; keyword?: string; unreadOnly?: boolean }) {
    const query = new URLSearchParams();
    if (typeof params?.page === "number") {
      query.set("page", String(params.page));
    }
    if (typeof params?.size === "number") {
      query.set("size", String(params.size));
    }
    if (params?.keyword?.trim()) {
      query.set("keyword", params.keyword.trim());
    }
    if (typeof params?.unreadOnly === "boolean") {
      query.set("unreadOnly", String(params.unreadOnly));
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<ApiResponse<NotificationListPayload>>(`/notifications${suffix}`, {
      authenticated: true,
    });
  },

  create(payload: NotificationCreatePayload) {
    return apiClient.post<ApiResponse<NotificationRecord>>("/notifications", payload, {
      authenticated: true,
    });
  },

  markRead(notificationId: string) {
    return apiClient.patch<ApiResponse<void>>(`/notifications/${notificationId}/read`, undefined, {
      authenticated: true,
    });
  },

  markAllRead() {
    return apiClient.patch<ApiResponse<void>>("/notifications/read-all", undefined, {
      authenticated: true,
    });
  },

  unreadCount() {
    return apiClient.get<ApiResponse<NotificationUnreadCountPayload>>("/notifications/unread-count", {
      authenticated: true,
    });
  },

  listAudienceClasses() {
    return apiClient.get<ApiResponse<NotificationAudienceClass[]>>("/notifications/audience-classes", {
      authenticated: true,
    });
  },
};
