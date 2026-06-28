import { apiClient } from "@/lib/api/api-client";
import type { ApiResponse } from "@/types/api";

export type ExamPermissionRecord = {
  id?: string;
  examId?: string;
  examTitle?: string;
  subjectName?: string;
  examDate?: string;
  studentCode?: string;
  studentName?: string;
  isAllowed?: boolean;
  reason?: string;
  approvedByEmail?: string;
  approvedByName?: string;
};

export const examPermissionApi = {
  listByExam(examId: string) {
    return apiClient.get<ApiResponse<ExamPermissionRecord[]>>(
      `/exam-permissions/by-exam/${examId}`,
      { authenticated: true },
    );
  },

  listByStudent(studentCode: string) {
    return apiClient.get<ApiResponse<ExamPermissionRecord[]>>(
      `/exam-permissions/by-student/${studentCode}`,
      { authenticated: true },
    );
  },

  upsert(payload: { examId: string; studentCode: string; isAllowed: boolean; reason?: string }) {
    return apiClient.post<ApiResponse<ExamPermissionRecord>>(
      "/exam-permissions",
      payload,
      { authenticated: true },
    );
  },

  delete(id: string) {
    return apiClient.delete<ApiResponse<void>>(`/exam-permissions/${id}`, {
      authenticated: true,
    });
  },
};
