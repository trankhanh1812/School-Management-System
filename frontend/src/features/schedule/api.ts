import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";

export const scheduleApi = {
  list() {
    return apiClient.get<ApiResponse<unknown[]>>("/schedules", {
      authenticated: true,
    });
  },
};
