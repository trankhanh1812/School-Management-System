import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";
import { getStoredTokens } from "@/lib/auth/token-storage";
import { env } from "@/lib/env";

export type ScoreRecord = {
  scoreId: string;
  studentCode: string;
  studentName: string;
  examId: string;
  examTitle: string;
  examType: string;
  classCode: string;
  teacherCode: string;
  teacherName: string;
  scoreValue: number;
  status: string;
  publishedAt?: string;
  editable: boolean;
};

export type ScoreHistoryRecord = {
  oldValue: number;
  newValue: number;
  changedBy: string;
  changeReason: string;
  changedAt: string;
};

export type ScoreUpsertPayload = {
  scoreValue?: number;
  changeReason?: string;
};

export type ScoreImportPreviewItem = {
  rowNumber: number;
  examTitle: string;
  classCode: string;
  studentCode: string;
  subjectCode: string;
  scoreValue?: number;
  note?: string;
  absentFlag?: boolean;
  hasErrors: boolean;
  errors: string[];
};

export type ScoreImportPreviewResponse = {
  importId: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  rows: ScoreImportPreviewItem[];
  issues: string[];
};

export const scoreApi = {
  list(examId?: string) {
    const suffix = examId ? `?examId=${encodeURIComponent(examId)}` : "";
    return apiClient.get<ApiResponse<ScoreRecord[]>>(`/scores${suffix}`, {
      authenticated: true,
    });
  },

  update(scoreId: string, payload: ScoreUpsertPayload) {
    return apiClient.put<ApiResponse<ScoreRecord>>(`/scores/${scoreId}`, payload, {
      authenticated: true,
    });
  },

  submit(examId: string) {
    return apiClient.patch<ApiResponse<void>>(`/scores/submit?examId=${encodeURIComponent(examId)}`, {
      authenticated: true,
    });
  },

  approve(scoreId: string) {
    return apiClient.patch<ApiResponse<ScoreRecord>>(`/scores/${scoreId}/approve`, {
      authenticated: true,
    });
  },

  publish(examId: string) {
    return apiClient.patch<ApiResponse<void>>(`/scores/publish?examId=${encodeURIComponent(examId)}`, {
      authenticated: true,
    });
  },

  history(scoreId: string) {
    return apiClient.get<ApiResponse<ScoreHistoryRecord[]>>(`/scores/${scoreId}/history`, {
      authenticated: true,
    });
  },

  async downloadImportTemplate() {
    const tokens = getStoredTokens();
    const response = await fetch(`${env.apiBaseUrl}/scores/import/template`, {
      method: "GET",
      headers: {
        Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : "",
      },
    });

    if (!response.ok) {
      throw new Error("Khong the tai template diem");
    }

    return response.blob();
  },

  async previewImport(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${env.apiBaseUrl}/scores/import/preview`, {
      method: "POST",
      headers: {
        Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Khong the tao preview diem");
    }

    const payload = (await response.json()) as ApiResponse<ScoreImportPreviewResponse>;
    return payload;
  },

  async importScores(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${env.apiBaseUrl}/scores/import`, {
      method: "POST",
      headers: {
        Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Import diem that bai");
    }

    const payload = (await response.json()) as ApiResponse<ScoreImportPreviewResponse>;
    return payload;
  },
};
