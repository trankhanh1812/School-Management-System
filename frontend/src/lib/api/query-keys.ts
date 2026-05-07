export const queryKeys = {
  auth: ["auth"] as const,
  dashboard: ["dashboard"] as const,
  students: ["students"] as const,
  studentDetail: (studentCode: string) => ["students", studentCode] as const,
  studentTranscript: (studentCode: string) => ["students", studentCode, "transcript"] as const,
  teachers: ["teachers"] as const,
  teacherDetail: (teacherCode: string) => ["teachers", teacherCode] as const,
  classes: ["classes"] as const,
  classDetail: (classCode: string) => ["classes", classCode] as const,
  reports: ["reports"] as const,
  schedules: ["schedules"] as const,
} as const;
