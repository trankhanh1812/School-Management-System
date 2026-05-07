export const userRoles = ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const;

export type UserRole = (typeof userRoles)[number];
