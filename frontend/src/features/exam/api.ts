import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";

export type ExamRecord = {
  examId: string;
  semesterCode: string;
  academicYearCode: string;
  subjectCode: string;
  subjectName: string;
  examType: string;
  examTypeLabel: string;
  assessmentGroup: string;
  title: string;
  examDate: string;
  weight: number;
  editWindowDays: number;
  status: string;
  classCodes: string[];
};

export type ExamUpsertPayload = {
  semesterCode: string;
  academicYearCode: string;
  subjectCode: string;
  examType: string;
  title: string;
  examDate: string;
  weight?: number;
  classCodes: string[];
  status?: string;
};

export const examApi = {
  list() {
    return apiClient.get<ApiResponse<ExamRecord[]>>("/exams", {
      authenticated: true,
    });
  },

  create(payload: ExamUpsertPayload) {
    return apiClient.post<ApiResponse<ExamRecord>>("/exams", payload, {
      authenticated: true,
    });
  },

  update(examId: string, payload: ExamUpsertPayload) {
    return apiClient.put<ApiResponse<ExamRecord>>(`/exams/${examId}`, payload, {
      authenticated: true,
    });
  },

  delete(examId: string) {
    return apiClient.delete<ApiResponse<void>>(`/exams/${examId}`, {
      authenticated: true,
    });
  },

  // Student: view upcoming exams for own class
  myExams(params?: { semesterCode?: string; academicYearCode?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.semesterCode) searchParams.set("semesterCode", params.semesterCode);
    if (params?.academicYearCode) searchParams.set("academicYearCode", params.academicYearCode);
    const qs = searchParams.toString();
    return apiClient.get<ApiResponse<ExamRecord[]>>(
      qs ? `/exams/me?${qs}` : "/exams/me",
      { authenticated: true },
    );
  },
};
