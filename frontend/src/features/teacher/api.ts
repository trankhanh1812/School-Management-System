import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";

export type TeacherApiRecord = {
  id?: string;
  teacherCode?: string;
  fullName?: string;
  department?: string;
  departmentLevel?: number;
  title?: string;
  phone?: string;
  email?: string;
  homeroomClass?: string;
  subjects?: unknown[];
  employmentStatus?: string;
  bio?: string;
  assignments?: unknown[];
};

export type AvailableHomeroomTeacherApiRecord = {
  teacherCode?: string;
  fullName?: string;
  department?: string;
};

export type TeacherDepartmentApiRecord = {
  id?: string;
  name?: string;
  headTeacher?: string;
  viceHeadTeacher?: string;
  teacherCount?: number;
  subjectCount?: number;
};

export type TeacherMetricApiRecord = {
  label?: string;
  value?: string;
  trend?: string;
  note?: string;
};

export type TeacherUpsertPayload = {
  teacherCode: string;
  fullName: string;
  departmentCode?: string;
  departmentLevel?: number;
  phone?: string;
  email?: string;
  status?: string;
};

type TeacherListQuery = {
  departmentQuery?: string;
  search?: string;
  limit?: number;
};

function buildQueryString(params?: Record<string, string | number | undefined>) {
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

export const teacherApi = {
  list(query?: TeacherListQuery) {
    const queryString = buildQueryString({
      departmentQuery: query?.departmentQuery,
      search: query?.search,
      limit: query?.limit,
    });

    return apiClient.get<ApiResponse<TeacherApiRecord[]>>(`/teachers${queryString}`, {
      authenticated: true,
    });
  },

  detail(teacherCode: string) {
    return apiClient.get<ApiResponse<TeacherApiRecord>>(`/teachers/${teacherCode}`, {
      authenticated: true,
    });
  },

  create(payload: TeacherUpsertPayload) {
    return apiClient.post<ApiResponse<TeacherApiRecord>>("/teachers", payload, {
      authenticated: true,
    });
  },

  update(teacherCode: string, payload: TeacherUpsertPayload) {
    return apiClient.put<ApiResponse<TeacherApiRecord>>(`/teachers/${teacherCode}`, payload, {
      authenticated: true,
    });
  },

  delete(teacherCode: string) {
    return apiClient.delete<ApiResponse<void>>(`/teachers/${teacherCode}`, {
      authenticated: true,
    });
  },

  departments() {
    return apiClient.get<ApiResponse<TeacherDepartmentApiRecord[]>>("/teachers/departments", {
      authenticated: true,
    });
  },

  availableHomeroomTeachers() {
    return apiClient.get<ApiResponse<AvailableHomeroomTeacherApiRecord[]>>(
      "/teachers/available-homeroom",
      {
        authenticated: true,
      },
    );
  },

  metrics() {
    return apiClient.get<ApiResponse<TeacherMetricApiRecord[]>>("/teachers/metrics", {
      authenticated: true,
    });
  },
};
