export type SubjectRecord = {
  code: string;
  name: string;
  departmentCode: string;
  departmentName: string;
  gradeLevel: number;
  status: string;
  assignmentCount: number;
};

export type SubjectMetric = {
  label: string;
  value: string;
  trend: string;
  note: string;
};
