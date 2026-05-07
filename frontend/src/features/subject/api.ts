import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";

export type SubjectApiRecord = {
  code?: string;
  name?: string;
  departmentCode?: string;
  departmentName?: string;
  gradeLevel?: number;
  status?: string;
  assignmentCount?: number;
};

export type SubjectMetricApiRecord = {
  label?: string;
  value?: string;
  trend?: string;
  note?: string;
};

export type SubjectUpsertPayload = {
  code: string;
  name: string;
  departmentCode: string;
  gradeLevel: number;
  status?: string;
};

export const subjectApi = {
  list() {
    return apiClient.get<ApiResponse<SubjectApiRecord[]>>("/subjects", {
      authenticated: true,
    });
  },

  detail(subjectCode: string) {
    return apiClient.get<ApiResponse<SubjectApiRecord>>(`/subjects/${subjectCode}`, {
      authenticated: true,
    });
  },

  create(payload: SubjectUpsertPayload) {
    return apiClient.post<ApiResponse<SubjectApiRecord>>("/subjects", payload, {
      authenticated: true,
    });
  },

  update(subjectCode: string, payload: SubjectUpsertPayload) {
    return apiClient.put<ApiResponse<SubjectApiRecord>>(`/subjects/${subjectCode}`, payload, {
      authenticated: true,
    });
  },

  delete(subjectCode: string) {
    return apiClient.delete<ApiResponse<void>>(`/subjects/${subjectCode}`, {
      authenticated: true,
    });
  },

  metrics() {
    return apiClient.get<ApiResponse<SubjectMetricApiRecord[]>>("/subjects/metrics", {
      authenticated: true,
    });
  },
};
