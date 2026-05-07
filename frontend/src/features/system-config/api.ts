import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";
import type { SystemSettingsRecord, SystemSettingsUpsertPayload } from "@/features/system-config/types";

export const systemConfigApi = {
  get() {
    return apiClient.get<ApiResponse<SystemSettingsRecord>>("/system-settings", {
      authenticated: true,
    });
  },

  update(payload: SystemSettingsUpsertPayload) {
    return apiClient.put<ApiResponse<SystemSettingsRecord>>("/system-settings", payload, {
      authenticated: true,
    });
  },
};
