export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data: T;
  meta?: ApiMeta;
  status?: number;
  timestamp?: string;
};

export type ApiErrorPayload = {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
  status?: number;
};
