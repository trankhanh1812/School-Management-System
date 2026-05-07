import type { ApiResponse } from "@/types/api";
import { apiClient } from "@/lib/api/api-client";
import { env } from "@/lib/env";
import { getStoredTokens } from "@/lib/auth/token-storage";

export type TeachingAssignmentApiRecord = {
  assignmentId?: string;
  teacherCode?: string;
  teacherName?: string;
  classCode?: string;
  className?: string;
  subjectCode?: string;
  subjectName?: string;
  semesterCode?: string;
  academicYearCode?: string;
  homeroom?: boolean;
  note?: string;
  scheduleData?: TeachingScheduleDetail[];
};

export type TeachingScheduleDetail = {
  day: number;        // 1-6 (Mon-Sat)
  period: number;     // 1-5
  shift: string;      // "morning" or "afternoon"
  classCode: string;
};

export type TeachingMetricApiRecord = {
  label?: string;
  value?: string;
  trend?: string;
  note?: string;
};

export type TeachingAssignmentUpsertPayload = {
  teacherCode: string;
  classCode: string;
  subjectCode: string;
  semesterCode: string;
  academicYearCode: string;
  isHomeroom?: boolean;
  note?: string;
  scheduleData?: TeachingScheduleDetail[];
};

export type TimetableEntryPayload = {
  classCode: string;
  subjectCode: string;
  dayOfWeek: number;
  periodStart: number;
  periodEnd: number;
};

export type TimetableVersionApiRecord = {
  versionId?: string;
  versionName?: string;
  versionNo?: number;
  status?: "DRAFT" | "LOCKED" | "EXPIRED" | string;
  active?: boolean;
  semesterCode?: string;
  academicYearCode?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  entryCount?: number;
};

export type TimetableGridUpsertPayload = {
  semesterCode: string;
  academicYearCode: string;
  versionName: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: "DRAFT" | "LOCKED";
  entries: TimetableEntryPayload[];
};

export type TimetableImportIssue = {
  row?: number;
  column?: string;
  classCode?: string;
  subjectCode?: string;
  message?: string;
};

export type TimetableImportPreviewResponse = {
  versionName?: string;
  academicYearCode?: string;
  semesterCode?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  totalDetectedCells?: number;
  validEntries?: number;
  invalidEntries?: number;
  entries?: TimetableEntryPayload[];
  issues?: TimetableImportIssue[];
};

export type TeachingConflictCheckPayload = {
  semesterCode: string;
  academicYearCode: string;
  subjectCode: string;
  assignments: Array<{
    classCode: string;
    teacherCode: string;
  }>;
};

export type TeachingConflictCheckResult = {
  missingTimetableClasses?: string[];
  conflicts?: Array<{
    teacherCode?: string;
    teacherName?: string;
    subjectCode?: string;
    dayOfWeek?: number;
    periodStart?: number;
    periodEnd?: number;
    affectedClasses?: string[];
  }>;
};

export const teachingApi = {
  list() {
    return apiClient.get<ApiResponse<TeachingAssignmentApiRecord[]>>("/teaching-assignments", {
      authenticated: true,
    });
  },

  listMine(academicYearId?: string) {
    const query = new URLSearchParams();
    if (academicYearId && academicYearId.trim()) {
      query.set("academicYearId", academicYearId.trim());
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<ApiResponse<TeachingAssignmentApiRecord[]>>(`/teaching-assignments/me${suffix}`, {
      authenticated: true,
    });
  },

  listByDepartment(departmentCode: string) {
    const query = new URLSearchParams({ departmentCode });
    return apiClient.get<ApiResponse<TeachingAssignmentApiRecord[]>>(
      `/teaching-assignments/by-department?${query.toString()}`,
      {
        authenticated: true,
      }
    );
  },

  listBySubject(
    subjectCode: string,
    params?: {
      semesterCode?: string;
      academicYearCode?: string;
      gradeLevel?: string;
    }
  ) {
    const query = new URLSearchParams();
    if (params?.semesterCode) {
      query.set("semesterCode", params.semesterCode);
    }
    if (params?.academicYearCode) {
      query.set("academicYearCode", params.academicYearCode);
    }
    if (params?.gradeLevel) {
      query.set("gradeLevel", params.gradeLevel);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<ApiResponse<TeachingAssignmentApiRecord[]>>(
      `/teaching-assignments/by-subject/${encodeURIComponent(subjectCode)}${suffix}`,
      {
        authenticated: true,
      }
    );
  },

  detail(assignmentId: string) {
    return apiClient.get<ApiResponse<TeachingAssignmentApiRecord>>(`/teaching-assignments/${assignmentId}`, {
      authenticated: true,
    });
  },

  create(payload: TeachingAssignmentUpsertPayload) {
    return apiClient.post<ApiResponse<TeachingAssignmentApiRecord>>("/teaching-assignments", payload, {
      authenticated: true,
    });
  },

  checkConflicts(payload: TeachingConflictCheckPayload) {
    return apiClient.post<ApiResponse<TeachingConflictCheckResult>>("/teaching-assignments/check-conflicts", payload, {
      authenticated: true,
    });
  },

  getTimetableGrid(semesterCode: string, academicYearCode: string, versionId?: string) {
    const query = new URLSearchParams({ semesterCode, academicYearCode });
    if (versionId && versionId.trim()) {
      query.set("versionId", versionId.trim());
    }

    return apiClient.get<ApiResponse<TimetableEntryPayload[]>>(`/teaching-assignments/timetable?${query.toString()}`, {
      authenticated: true,
    });
  },

  listTimetableVersions(semesterCode: string, academicYearCode: string) {
    const query = new URLSearchParams({ semesterCode, academicYearCode });
    return apiClient.get<ApiResponse<TimetableVersionApiRecord[]>>(`/teaching-assignments/timetable/versions?${query.toString()}`, {
      authenticated: true,
    });
  },

  upsertTimetableGrid(payload: TimetableGridUpsertPayload) {
    return apiClient.post<ApiResponse<void>>("/teaching-assignments/timetable", payload, {
      authenticated: true,
    });
  },

  async downloadTimetableImportTemplate() {
    const tokens = getStoredTokens();
    const response = await fetch(`${env.apiBaseUrl}/teaching-assignments/timetable/import/template`, {
      method: "GET",
      headers: {
        Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : "",
      },
    });

    if (!response.ok) {
      throw new Error("Khong the tai template import TKB");
    }

    return response.blob();
  },

  async previewTimetableImport(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${env.apiBaseUrl}/teaching-assignments/timetable/import/preview`, {
      method: "POST",
      headers: {
        Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Khong the preview import TKB");
    }

    return (await response.json()) as ApiResponse<TimetableImportPreviewResponse>;
  },

  async importTimetable(file: File) {
    const tokens = getStoredTokens();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${env.apiBaseUrl}/teaching-assignments/timetable/import`, {
      method: "POST",
      headers: {
        Authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Khong the import thoi khoa bieu");
    }

    return (await response.json()) as ApiResponse<TimetableImportPreviewResponse>;
  },

  update(assignmentId: string, payload: TeachingAssignmentUpsertPayload) {
    return apiClient.put<ApiResponse<TeachingAssignmentApiRecord>>(`/teaching-assignments/${assignmentId}`, payload, {
      authenticated: true,
    });
  },

  delete(assignmentId: string) {
    return apiClient.delete<ApiResponse<void>>(`/teaching-assignments/${assignmentId}`, {
      authenticated: true,
    });
  },

  metrics() {
    return apiClient.get<ApiResponse<TeachingMetricApiRecord[]>>("/teaching-assignments/metrics", {
      authenticated: true,
    });
  },
};
