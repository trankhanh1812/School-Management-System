import {
  classroomRecords,
  promotionPlans,
} from "@/features/classroom/classroom-data";
import { studentRecords } from "@/features/student/student-data";
import {
  departmentRecords,
  teacherRecords,
  teachingAssignments,
} from "@/features/teacher/teacher-data";

const parseAverage = (value: string) => Number.parseFloat(value);

export const reportMetrics = [
  {
    label: "Tổng học sinh",
    value: String(studentRecords.length),
    trend: "+12%",
    note: "Tính trên dữ liệu học sinh mẫu đang theo học trong hệ thống.",
  },
  {
    label: "Lớp đang quản lý",
    value: String(classroomRecords.length),
    trend: "Ổn định",
    note: "Mỗi lớp là một bản ghi độc lập theo năm học.",
  },
  {
    label: "Phân công giảng dạy",
    value: String(teachingAssignments.length),
    trend: "+4",
    note: "Tổng phân công giảng dạy theo giáo viên, môn, lớp và học kỳ.",
  },
  {
    label: "Đề án promotion",
    value: String(promotionPlans.length),
    trend: "+3",
    note: "Bao gồm lên lớp, điều chuyển, lưu ban và tốt nghiệp.",
  },
];

export const topStudents = [...studentRecords]
  .sort((a, b) => parseAverage(b.scoreAverage) - parseAverage(a.scoreAverage))
  .slice(0, 3)
  .map((student) => ({
    studentCode: student.studentCode,
    fullName: student.fullName,
    className: student.className,
    scoreAverage: student.scoreAverage,
    conduct: student.conduct,
  }));

export const classPerformance = classroomRecords.map((classroom) => {
  const relatedStudents = studentRecords.filter(
    (student) => student.className === classroom.className,
  );
  const average =
    relatedStudents.reduce(
      (sum, student) => sum + parseAverage(student.scoreAverage),
      0,
    ) / Math.max(relatedStudents.length, 1);

  return {
    className: classroom.className,
    academicYear: classroom.academicYear,
    totalStudents: relatedStudents.length,
    averageScore: average.toFixed(1),
    homeroomTeacher: classroom.homeroomTeacher,
  };
});

export const conductDistribution = ["Tốt", "Khá", "Trung bình", "Yếu"].map(
  (conduct) => ({
    label: conduct,
    value: studentRecords.filter((student) => student.conduct === conduct)
      .length,
  }),
);

export const academicRankDistribution = [
  { label: "Giỏi", min: 8 },
  { label: "Khá", min: 6.5 },
  { label: "Trung bình", min: 5 },
  { label: "Cần hỗ trợ", min: 0 },
].map((rank, index, allRanks) => {
  const nextMin =
    index === 0 ? Number.POSITIVE_INFINITY : allRanks[index - 1].min;

  const count = studentRecords.filter((student) => {
    const score = parseAverage(student.scoreAverage);
    return score >= rank.min && score < nextMin;
  }).length;

  return {
    label: rank.label,
    value: count,
  };
});

export const departmentLoad = departmentRecords.map((department) => ({
  department: department.name,
  headTeacher: department.headTeacher,
  teacherCount: department.teacherCount,
  assignmentCount: teachingAssignments.filter(
    (assignment) => assignment.department === department.name,
  ).length,
}));

export const reportExports = [
  {
    reportName: "Bảng điểm học sinh",
    scope: "Theo từng học sinh",
    format: "PDF / Excel",
    source: "student + score + transcript",
  },
  {
    reportName: "Bảng điểm lớp",
    scope: "Theo lớp và năm học",
    format: "PDF / Excel",
    source: "classroom + student + teaching assignment",
  },
  {
    reportName: "Thống kê học lực",
    scope: "Toàn trường",
    format: "Dashboard / PDF",
    source: "student + transcriptOverview",
  },
  {
    reportName: "Phân công giảng dạy",
    scope: "Theo giáo viên / bộ môn",
    format: "Excel",
    source: "teacher + teaching assignment",
  },
];

export const teacherLoad = teacherRecords.map((teacher) => ({
  teacherCode: teacher.teacherCode,
  fullName: teacher.fullName,
  department: teacher.department,
  totalAssignments: teacher.assignments.length,
  homeroomClass: teacher.homeroomClass ?? "Không có",
}));
