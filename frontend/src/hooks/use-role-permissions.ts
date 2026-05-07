"use client";

import type { UserRole } from "@/constants/roles";
import { useAuthSession } from "./use-auth-session";

export type Permission = 
  | "view_students"
  | "create_student"
  | "edit_student"
  | "delete_student"
  | "view_all_students"
  | "view_own_student"
  | "view_scores"
  | "manage_scores"
  | "view_attendance"
  | "manage_attendance"
  | "view_reports"
  | "view_all_teachers"
  | "manage_teachers"
  | "manage_classes"
  | "manage_subjects"
  | "manage_system";

export type FeatureVisibility = {
  showStudentManagement: boolean;
  showTeacherManagement: boolean;
  showClassManagement: boolean;
  showSubjectManagement: boolean;
  showScoreManagement: boolean;
  showAttendanceManagement: boolean;
  showReports: boolean;
  showSystemSettings: boolean;
  canCreateStudent: boolean;
  canEditStudent: boolean;
  canDeleteStudent: boolean;
  canViewAllStudents: boolean;
  canViewOwnProfile: boolean;
  canViewAllScores: boolean;
  canInputScores: boolean;
  canApproveScores: boolean;
};

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "view_students",
    "create_student",
    "edit_student",
    "delete_student",
    "view_all_students",
    "view_scores",
    "manage_scores",
    "view_attendance",
    "manage_attendance",
    "view_reports",
    "view_all_teachers",
    "manage_teachers",
    "manage_classes",
    "manage_subjects",
    "manage_system",
  ],
  TEACHER: [
    "view_students",
    "view_all_students",
    "view_scores",
    "manage_scores",
    "view_attendance",
    "manage_attendance",
    "view_reports",
  ],
  STUDENT: [
    "view_own_student",
    "view_scores",
    "view_attendance",
  ],
  PARENT: [
    "view_own_student",
    "view_scores",
    "view_attendance",
  ],
};

export function useRolePermissions(): {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  features: FeatureVisibility;
} {
  const { session } = useAuthSession();
  const userRole = session?.user.role || "STUDENT";
  const permissions = rolePermissions[userRole];

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const features: FeatureVisibility = {
    showStudentManagement: hasPermission("view_students"),
    showTeacherManagement: hasPermission("manage_teachers"),
    showClassManagement: hasPermission("manage_classes"),
    showSubjectManagement: hasPermission("manage_subjects"),
    showScoreManagement: hasPermission("manage_scores"),
    showAttendanceManagement: hasPermission("manage_attendance"),
    showReports: hasPermission("view_reports"),
    showSystemSettings: hasPermission("manage_system"),
    canCreateStudent: hasPermission("create_student"),
    canEditStudent: hasPermission("edit_student"),
    canDeleteStudent: hasPermission("delete_student"),
    canViewAllStudents: hasPermission("view_all_students"),
    canViewOwnProfile: hasPermission("view_own_student"),
    canViewAllScores: hasPermission("view_scores"),
    canInputScores: hasPermission("manage_scores"),
    canApproveScores: hasPermission("manage_scores"),
  };

  return {
    permissions,
    hasPermission,
    features,
  };
}
