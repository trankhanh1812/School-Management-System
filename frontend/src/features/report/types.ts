export type ReportFilters = {
  academicYear?: string;
  semester?: string;
  classId?: string;
};

export type DistributionItem = {
  label: string;
  value: number;
  color?: string;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type ReportMetric = {
  label: string;
  value: string;
  trend: string;
  note: string;
};

export type TopStudentItem = {
  studentCode: string;
  fullName: string;
  className: string;
  scoreAverage: string;
  conduct: string;
};

export type ClassPerformanceItem = {
  className: string;
  academicYear: string;
  totalStudents: number;
  averageScore: string;
  passRate: string;
  homeroomTeacher: string;
};

export type TeacherLoadItem = {
  teacherCode: string;
  fullName: string;
  department: string;
  totalAssignments: number;
  homeroomClass: string;
};

export type SubjectLoadItem = {
  subjectCode: string;
  subjectName: string;
  assignmentCount: number;
  teacherCount: number;
  classCount: number;
};

export type DepartmentLoadItem = {
  department: string;
  teacherCount: number;
  assignmentCount: number;
};

export type RiskAlertItem = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

export type ReportExportItem = {
  reportName: string;
  scope: string;
  format: string;
  source: string;
};

export type EducationAnalyticsSnapshot = {
  reportMetrics: ReportMetric[];
  conductDistribution: DistributionItem[];
  academicRankDistribution: DistributionItem[];
  scoreStatusDistribution: DistributionItem[];
  genderDistribution: DistributionItem[];
  attendanceDistribution: DistributionItem[];
  classPerformance: ClassPerformanceItem[];
  teacherLoad: TeacherLoadItem[];
  subjectLoad: SubjectLoadItem[];
  departmentLoad: DepartmentLoadItem[];
  topStudents: TopStudentItem[];
  examTimeline: TrendPoint[];
  scoreTimeline: TrendPoint[];
  riskAlerts: RiskAlertItem[];
  reportExports: ReportExportItem[];
};
