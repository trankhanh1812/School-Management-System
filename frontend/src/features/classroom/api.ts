import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";
import { getStoredTokens } from "@/lib/auth/token-storage";
import { env } from "@/lib/env";

export type ClassroomApiRecord = {
  classCode?: string;
  className?: string;
  grade?: string;
  academicYear?: string;
  homeroomTeacher?: string;
  totalStudents?: number;
  room?: string;
  shift?: string;
  status?: string;
  notes?: string;
};

export type ClassroomMetricApiRecord = {
  label?: string;
  value?: string;
  trend?: string;
  note?: string;
};

export type ClassStudentApiRecord = {
  studentCode?: string;
  fullName?: string;
  conduct?: string;
  scoreAverage?: string;
  status?: string;
};

export type PromotionPlanApiRecord = {
  studentCode?: string;
  studentName?: string;
  currentClass?: string;
  nextAcademicYear?: string;
  proposedClass?: string;
  action?: "promote" | "repeat" | "transfer" | "graduate";
  reason?: string;
  status?: "draft" | "reviewed" | "approved";
};

export type PromotionImportPreviewItem = {
  rowNumber: number;
  studentCode: string;
  studentName: string;
  currentClass: string;
  currentAcademicYear: string;
  proposedClass: string;
  nextAcademicYear: string;
  action: string;
  note?: string;
  hasErrors: boolean;
  errors: string[];
};

export type PromotionImportPreviewResponse = {
  importId: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  rows: PromotionImportPreviewItem[];
  issues: string[];
};

export type ClassroomUpsertPayload = {
  classCode: string;
  className: string;
  academicYearCode: string;
  gradeLevel: number;
  homeroomTeacherCode?: string;
  capacity: number;
};

type ClassroomListQuery = {
  academicYearCode?: string;
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

export const classroomApi = {
  list(query?: ClassroomListQuery) {
    const queryString = buildQueryString({
      academicYearCode: query?.academicYearCode,
      search: query?.search,
      limit: query?.limit,
      scope: query?.scope,
    });

    return apiClient.get<ApiResponse<ClassroomApiRecord[]>>(
      `/classes${queryString}`,
      {
        authenticated: true,
      },
    );
  },

  detail(classCode: string) {
    return apiClient.get<ApiResponse<ClassroomApiRecord>>(
      `/classes/${classCode}`,
      {
        authenticated: true,
      },
    );
  },

  create(payload: ClassroomUpsertPayload) {
    return apiClient.post<ApiResponse<ClassroomApiRecord>>(
      "/classes",
      payload,
      {
        authenticated: true,
      },
    );
  },

  update(classCode: string, payload: ClassroomUpsertPayload) {
    return apiClient.put<ApiResponse<ClassroomApiRecord>>(
      `/classes/${classCode}`,
      payload,
      {
        authenticated: true,
      },
    );
  },

  delete(classCode: string) {
    return apiClient.delete<ApiResponse<void>>(`/classes/${classCode}`, {
      authenticated: true,
    });
  },

  metrics() {
    return apiClient.get<ApiResponse<ClassroomMetricApiRecord[]>>(
      "/classes/metrics",
      {
        authenticated: true,
      },
    );
  },

  students(classCode: string) {
    return apiClient.get<ApiResponse<ClassStudentApiRecord[]>>(
      `/classes/${classCode}/students`,
      {
        authenticated: true,
      },
    );
  },

  promotionPlans(classCode: string) {
    return apiClient.get<ApiResponse<PromotionPlanApiRecord[]>>(
      `/classes/${classCode}/promotion-plans`,
      {
        authenticated: true,
      },
    );
  },

  allPromotionPlans() {
    return this.list().then(async (classesResponse) => {
      const classes = Array.isArray(classesResponse.data)
        ? classesResponse.data
        : [];
      const plans = await Promise.all(
        classes
          .map((item) => item.classCode)
          .filter(
            (code): code is string =>
              typeof code === "string" && code.length > 0,
          )
          .map((code) => this.promotionPlans(code)),
      );

      return plans.flatMap((item) =>
        Array.isArray(item.data) ? item.data : [],
      );
    });
  },

  studentsByClassName(classCode: string) {
    return this.students(classCode);
  },

  promotionPlansByClassName(classCode: string) {
    return this.promotionPlans(classCode);
  },

  fallbackList() {
    return apiClient.get<ApiResponse<ClassroomApiRecord[]>>("/classes", {
      authenticated: true,
    });
  },

  async downloadPromotionImportTemplate() {
    const tokens = getStoredTokens();
    const response = await fetch(
      `${env.apiBaseUrl}/classes/promotion/import/template`,
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
      throw new Error("Không thể tải mẫu xét lên lớp");
    }

    return response.blob();
  },

  async previewPromotionImport(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${env.apiBaseUrl}/classes/promotion/import/preview`,
      {
        method: "POST",
        headers: {
          Authorization: tokens?.accessToken
            ? `Bearer ${tokens.accessToken}`
            : "",
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Không thể tạo bản xem trước xét lên lớp");
    }

    const payload =
      (await response.json()) as ApiResponse<PromotionImportPreviewResponse>;
    return payload;
  },

  async importPromotion(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${env.apiBaseUrl}/classes/promotion/import`, {
      method: "POST",
      headers: {
        Authorization: tokens?.accessToken
          ? `Bearer ${tokens.accessToken}`
          : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Nhập dữ liệu xét lên lớp thất bại");
    }

    const payload =
      (await response.json()) as ApiResponse<PromotionImportPreviewResponse>;
    return payload;
  },

  autoCalculatePromotion(classCode: string, semesterCode?: string) {
    const qs = semesterCode
      ? `?semesterCode=${encodeURIComponent(semesterCode)}`
      : "";
    return apiClient.get<ApiResponse<PromotionPlanApiRecord[]>>(
      `/classes/${encodeURIComponent(classCode)}/promotion/auto-calculate${qs}`,
      { authenticated: true },
    );
  },
};
