import type { ApiErrorPayload } from "@/types/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string[]>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status ?? 500;
    this.code = payload.code;
    this.details = payload.details;
  }
}
