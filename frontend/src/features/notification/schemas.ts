export const notificationValidation = {
  audiences: ["all", "admin", "teacher", "student", "parent"] as const,
  channels: ["APP", "EMAIL", "SMS"] as const,
  notificationTypes: ["SCORE_UPDATE", "ATTENDANCE", "SCHEDULE_CHANGE", "EVENT", "ANNOUNCEMENT", "SYSTEM"] as const,
};
