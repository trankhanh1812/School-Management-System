export type SystemSettingsRecord = {
  allowedSchoolIps: string[];
  oralWeight: number;
  quiz15Weight: number;
  onePeriodWeight: number;
  midtermWeight: number;
  finalWeight: number;
  scoreEditWindowDays: number;
  requireAdminApproval: boolean;
  // Chính sách xét lên lớp
  passMark: number;
  failingSubjectMark: number;
  maxFailedSubjectsToPromote: number;
  graduationGradeLevel: number;
};

export type SystemSettingsUpsertPayload = SystemSettingsRecord;
