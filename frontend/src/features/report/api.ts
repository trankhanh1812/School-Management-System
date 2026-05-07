import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";

export const reportApi = {
  dashboard() {
    return apiClient.get<ApiResponse<unknown>>("/reports/dashboard", {
      authenticated: true,
    });
  },
};
