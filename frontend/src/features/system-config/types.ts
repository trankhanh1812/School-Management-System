export type SystemSettingsRecord = {
  allowedSchoolIps: string[];
  oralWeight: number;
  quiz15Weight: number;
  onePeriodWeight: number;
  midtermWeight: number;
  finalWeight: number;
  scoreEditWindowDays: number;
  requireAdminApproval: boolean;
};

export type SystemSettingsUpsertPayload = SystemSettingsRecord;
