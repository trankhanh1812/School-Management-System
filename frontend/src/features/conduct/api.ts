import { apiClient } from "@/lib/api/api-client";
import type { ApiResponse } from "@/types/api";

export type ConductRecord = {
  id?: string;
  studentCode?: string;
  studentName?: string;
  semesterCode?: string;
  academicYearCode?: string;
  classCode?: string;
  className?: string;
  conductLevel?: string;
  remarks?: string;
  assessedByTeacherCode?: string;
  assessedByName?: string;
};

export type ConductUpsertPayload = {
  studentCode: string;
  semesterCode: string;
  classCode: string;
  conductLevel: string;
  remarks?: string;
  assessedByTeacherCode: string;
};

export const conductApi = {
  list() {
    return apiClient.get<ApiResponse<ConductRecord[]>>("/conducts", {
      authenticated: true,
    });
  },

  detail(id: string) {
    return apiClient.get<ApiResponse<ConductRecord>>(`/conducts/${id}`, {
      authenticated: true,
    });
  },

  create(payload: ConductUpsertPayload) {
    return apiClient.post<ApiResponse<ConductRecord>>("/conducts", payload, {
      authenticated: true,
    });
  },

  update(id: string, payload: ConductUpsertPayload) {
    return apiClient.put<ApiResponse<ConductRecord>>(
      `/conducts/${id}`,
      payload,
      {
        authenticated: true,
      },
    );
  },

  delete(id: string) {
    return apiClient.delete<ApiResponse<void>>(`/conducts/${id}`, {
      authenticated: true,
    });
  },

  // Student: view own conduct records
  myConduct() {
    return apiClient.get<ApiResponse<ConductRecord[]>>("/conducts/me", {
      authenticated: true,
    });
  },

  // Teacher/Admin: view conduct by class
  byClass(classCode: string, semesterCode?: string) {
    const qs = semesterCode
      ? `?classCode=${classCode}&semesterCode=${semesterCode}`
      : `?classCode=${classCode}`;
    return apiClient.get<ApiResponse<ConductRecord[]>>(`/conducts/by-class${qs}`, {
      authenticated: true,
    });
  },

  // View conduct by student code
  byStudent(studentCode: string) {
    return apiClient.get<ApiResponse<ConductRecord[]>>(
      `/conducts/by-student/${studentCode}`,
      { authenticated: true },
    );
  },
};
