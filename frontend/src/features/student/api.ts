import { apiClient } from "@/lib/api/api-client";
import { env } from "@/lib/env";
import { getStoredTokens } from "@/lib/auth/token-storage";
import type { ApiResponse } from "@/types/api";

export type StudentApiRecord = {
  studentCode: string;
  fullName: string;
  className?: string;
  academicYear?: string;
  conduct?: string;
  scoreAverage?: string;
  status?: string;
  homeroomTeacher?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  avatarLabel?: string;
  parents?: unknown[];
  academicHistory?: unknown[];
  transcript?: unknown[];
  transcriptOverview?: unknown[];
  subjectResults?: unknown[];
  alerts?: string[];
};

export type StudentScoreApiRecord = {
  academicYear?: string;
  subject?: string;
  teacher?: string;
  semester?: string;
  officialAverage?: string;
  surveyAverage?: string;
  rank?: string;
  assessments?: unknown[];
};

export type StudentTranscriptApiRecord = {
  transcript?: unknown[];
  transcriptOverview?: unknown[];
};

export type PromotionRecord = {
  fromClassName: string;
  fromAcademicYear: string;
  toClassName: string;
  toAcademicYear: string;
  promotionResult: string;
  promotedAt: string;
  promotedByName: string;
};

export type PromotionHistoryApiRecord = {
  studentCode: string;
  fullName: string;
  records: PromotionRecord[];
};

export type ScoreHistoryRecord = {
  examTitle: string;
  subjectName: string;
  examType: string;
  oldValue: number | null;
  newValue: number | null;
  changeReason: string;
  changedAt: string;
  changedByName: string;
};

export type ScoreHistoryApiRecord = {
  studentCode: string;
  fullName: string;
  records: ScoreHistoryRecord[];
};

export type StudentUpsertPayload = {
  studentCode: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  academicYear?: string;
  className?: string;
  status?: string;
  conduct?: string;
};

export type ImportErrorRecord = {
  row?: number;
  error?: string;
  student_code?: string;
  field?: string;
};

export type StudentBulkImportResponse = {
  importId: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: ImportErrorRecord[];
  message?: string;
};

export type StudentPreviewItem = {
  row_number: number;
  student_code?: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  class_name?: string;
  academic_year?: string;
  status?: string;
  enrollment_date?: string;
  has_errors: boolean;
  errors: string[];
};

export type ParentPreviewItem = {
  row_number: number;
  student_code?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  relation?: string;
  is_primary?: string;
  has_errors: boolean;
  errors: string[];
};

export type StudentImportPreviewResponse = {
  import_id: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  students: StudentPreviewItem[];
  parents: ParentPreviewItem[];
  errors: ImportErrorRecord[];
};

type StudentListQuery = {
  academicYearCode?: string;
  classQuery?: string;
  status?: string;
  search?: string;
  limit?: number;
  scope?: "current" | "all";
};

function buildQueryString(
  params?: Record<string, string | number | undefined>,
) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      searchParams.set(key, `${value}`);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const studentApi = {
  list(query?: StudentListQuery) {
    const queryString = buildQueryString({
      academicYearCode: query?.academicYearCode,
      classQuery: query?.classQuery,
      status: query?.status,
      search: query?.search,
      limit: query?.limit,
      scope: query?.scope,
    });

    return apiClient.get<ApiResponse<StudentApiRecord[]>>(
      `/students${queryString}`,
      {
        authenticated: true,
      },
    );
  },

  detail(studentCode: string) {
    return apiClient.get<ApiResponse<StudentApiRecord>>(
      `/students/${studentCode}`,
      {
        authenticated: true,
      },
    );
  },

  scores(studentCode: string) {
    return apiClient.get<ApiResponse<StudentScoreApiRecord[]>>(
      `/students/${studentCode}/scores`,
      {
        authenticated: true,
      },
    );
  },

  transcript(studentCode: string) {
    return apiClient.get<ApiResponse<StudentTranscriptApiRecord>>(
      `/students/${studentCode}/transcript`,
      {
        authenticated: true,
      },
    );
  },

  myProfile() {
    return apiClient.get<ApiResponse<StudentApiRecord>>(
      "/students/me/profile",
      {
        authenticated: true,
      },
    );
  },

  myScores() {
    return apiClient.get<ApiResponse<StudentScoreApiRecord[]>>(
      "/students/me/scores",
      {
        authenticated: true,
      },
    );
  },

  myTranscript() {
    return apiClient.get<ApiResponse<StudentTranscriptApiRecord>>(
      "/students/me/transcript",
      {
        authenticated: true,
      },
    );
  },

  promotionHistory(studentCode: string) {
    return apiClient.get<ApiResponse<PromotionHistoryApiRecord>>(
      `/students/${studentCode}/promotion-history`,
      {
        authenticated: true,
      },
    );
  },

  scoreHistory(studentCode: string) {
    return apiClient.get<ApiResponse<ScoreHistoryApiRecord>>(`/students/${studentCode}/score-history`, {
      authenticated: true,
    });
  },

  create(payload: StudentUpsertPayload) {
    return apiClient.post<ApiResponse<StudentApiRecord>>("/students", payload, {
      authenticated: true,
    });
  },

  update(studentCode: string, payload: StudentUpsertPayload) {
    return apiClient.put<ApiResponse<StudentApiRecord>>(
      `/students/${studentCode}`,
      payload,
      {
        authenticated: true,
      },
    );
  },

  delete(studentCode: string) {
    return apiClient.delete<ApiResponse<void>>(`/students/${studentCode}`, {
      authenticated: true,
    });
  },

  async downloadImportTemplate() {
    const tokens = getStoredTokens();
    const response = await fetch(`${env.apiBaseUrl}/students/import/template`, {
      method: "GET",
      headers: {
        Authorization: tokens?.accessToken
          ? `Bearer ${tokens.accessToken}`
          : "",
      },
    });

    if (!response.ok) {
      throw new Error("Khong the tai template");
    }

    return response.blob();
  },

  async importStudents(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${env.apiBaseUrl}/students/import`, {
      method: "POST",
      headers: {
        Authorization: tokens?.accessToken
          ? `Bearer ${tokens.accessToken}`
          : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Import that bai");
    }

    const payload =
      (await response.json()) as ApiResponse<StudentBulkImportResponse>;
    return payload;
  },

  async previewImport(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${env.apiBaseUrl}/students/import/preview`, {
      method: "POST",
      headers: {
        Authorization: tokens?.accessToken
          ? `Bearer ${tokens.accessToken}`
          : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Khong the tao preview");
    }

    const payload =
      (await response.json()) as ApiResponse<StudentImportPreviewResponse>;
    return payload;
  },

  async downloadImportErrors(importId: string) {
    const tokens = getStoredTokens();
    const response = await fetch(
      `${env.apiBaseUrl}/students/import/errors/${importId}`,
      {
        method: "GET",
        headers: {
          Authorization: tokens?.accessToken
            ? `Bearer ${tokens.accessToken}`
            : "",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Khong the tai file loi");
    }

    return response.blob();
  },
};
