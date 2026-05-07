import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";

export const healthService = {
  ping() {
    return apiClient.get<ApiResponse<{ status: string; timestamp: string }>>("/auth/health");
  },
};
