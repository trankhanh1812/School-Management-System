export type TeachingAssignmentRecord = {
  assignmentId: string;
  teacherCode: string;
  teacherName: string;
  classCode: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  semesterCode: string;
  academicYearCode: string;
  homeroom: boolean;
  scheduleData?: {
    day: number;
    period: number;
    shift: string;
    classCode: string;
  }[];
};

export type TeachingMetric = {
  label: string;
  value: string;
  trend: string;
  note: string;
};
