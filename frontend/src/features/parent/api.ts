import { apiClient } from "@/lib/api/api-client";
import type { ApiResponse } from "@/types/api";
import type { StudentApiRecord, StudentScoreApiRecord, StudentTranscriptApiRecord } from "@/features/student/api";
import type { ConductRecord } from "@/features/conduct/api";
import type { ExamRecord } from "@/features/exam/api";

export type LinkedChild = {
  studentCode: string;
  fullName: string;
  className?: string;
  academicYear?: string;
  status?: string;
  avatarLabel?: string;
  isPrimaryContact?: boolean;
  canViewScore?: boolean;
};

export type ParentProfileRecord = {
  parentCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  children: LinkedChild[];
};

export const parentApi = {
  /** Thông tin phụ huynh + danh sách con được liên kết */
  myProfile() {
    return apiClient.get<ApiResponse<ParentProfileRecord>>("/parents/me/profile", {
      authenticated: true,
    });
  },

  /** Hồ sơ chi tiết của một con */
  childProfile(studentCode: string) {
    return apiClient.get<ApiResponse<StudentApiRecord>>(
      `/parents/me/children/${studentCode}/profile`,
      { authenticated: true },
    );
  },

  /** Điểm số của một con */
  childScores(studentCode: string) {
    return apiClient.get<ApiResponse<StudentScoreApiRecord[]>>(
      `/parents/me/children/${studentCode}/scores`,
      { authenticated: true },
    );
  },

  /** Học bạ của một con */
  childTranscript(studentCode: string) {
    return apiClient.get<ApiResponse<StudentTranscriptApiRecord>>(
      `/parents/me/children/${studentCode}/transcript`,
      { authenticated: true },
    );
  },

  /** Hạnh kiểm của một con */
  childConduct(studentCode: string) {
    return apiClient.get<ApiResponse<ConductRecord[]>>(
      `/parents/me/children/${studentCode}/conduct`,
      { authenticated: true },
    );
  },

  /** Lịch thi của một con */
  childExams(studentCode: string, params?: { semesterCode?: string }) {
    const qs = params?.semesterCode
      ? `?semesterCode=${params.semesterCode}`
      : "";
    return apiClient.get<ApiResponse<ExamRecord[]>>(
      `/parents/me/children/${studentCode}/exams${qs}`,
      { authenticated: true },
    );
  },
};
