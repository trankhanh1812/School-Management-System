import { studentRecords } from "@/features/student/student-data";

export type ClassroomRecord = {
  classCode: string;
  className: string;
  grade: string;
  academicYear: string;
  homeroomTeacher: string;
  totalStudents: number;
  room: string;
  shift: string;
  status: string;
  notes: string;
};

export type PromotionPlan = {
  studentCode: string;
  studentName: string;
  currentClass: string;
  nextAcademicYear: string;
  proposedClass: string;
  action: "promote" | "repeat" | "transfer" | "graduate";
  reason: string;
  status: "draft" | "reviewed" | "approved";
};

export const classroomMetrics = [
  {
    label: "Lớp đang hoạt động",
    value: "32",
    trend: "100%",
    note: "Toàn bộ lớp năm học 2026 - 2027 đã mở thành công.",
  },
  {
    label: "Đề án lên lớp nháp",
    value: "61",
    trend: "+18",
    note: "Bao gồm cả học sinh xét lên lớp, lưu ban và chuyển lớp.",
  },
  {
    label: "Học sinh chuyển lớp",
    value: "9",
    trend: "+2",
    note: "Đã phát sinh thay đổi student-class trong học kỳ II.",
  },
  {
    label: "Lớp chờ GVCN",
    value: "2",
    trend: "-1",
    note: "Còn 2 lớp cho năm học mới chưa chốt giáo viên chủ nhiệm.",
  },
];

export const classroomRecords: ClassroomRecord[] = [
  {
    classCode: "10A1-2026",
    className: "10A1",
    grade: "Khối 10",
    academicYear: "2026 - 2027",
    homeroomTeacher: "Nguyễn Thu Hà",
    totalStudents: 41,
    room: "A203",
    shift: "Sáng",
    status: "Ổn định",
    notes: "Lớp định hướng học thuật, kết quả khảo sát đầu vào cao.",
  },
  {
    classCode: "11A2-2026",
    className: "11A2",
    grade: "Khối 11",
    academicYear: "2026 - 2027",
    homeroomTeacher: "Lê Quốc Bảo",
    totalStudents: 39,
    room: "B102",
    shift: "Sáng",
    status: "Ổn định",
    notes: "Tỷ lệ chuyên cần cao, có 5 học sinh thuộc nhóm mũi nhọn.",
  },
  {
    classCode: "12A1-2026",
    className: "12A1",
    grade: "Khối 12",
    academicYear: "2026 - 2027",
    homeroomTeacher: "Phạm Hải Yến",
    totalStudents: 38,
    room: "C301",
    shift: "Chiều",
    status: "Cần theo dõi",
    notes: "Đang tập trung ôn thi tốt nghiệp và theo dõi nhóm học lực yếu.",
  },
];

export const promotionPlans: PromotionPlan[] = [
  {
    studentCode: "HS10231",
    studentName: "Nguyễn Minh Anh",
    currentClass: "10A1",
    nextAcademicYear: "2027 - 2028",
    proposedClass: "11A1",
    action: "promote",
    reason: "Đủ điều kiện lên lớp và giữ nhóm lớp chọn.",
    status: "reviewed",
  },
  {
    studentCode: "HS10742",
    studentName: "Trần Gia Hân",
    currentClass: "10A1",
    nextAcademicYear: "2027 - 2028",
    proposedClass: "11A2",
    action: "promote",
    reason: "Lên lớp bình thường, điều chuyển lớp để cân sĩ số.",
    status: "draft",
  },
  {
    studentCode: "HS11308",
    studentName: "Phạm Quang Huy",
    currentClass: "11A2",
    nextAcademicYear: "2027 - 2028",
    proposedClass: "12A1",
    action: "promote",
    reason: "Lên lớp và tiếp tục ở nhóm tăng cường Tin học.",
    status: "approved",
  },
  {
    studentCode: "HS12016",
    studentName: "Lê Hoàng Nam",
    currentClass: "12A1",
    nextAcademicYear: "2027 - 2028",
    proposedClass: "12A1",
    action: "repeat",
    reason: "Cần phương án hỗ trợ thêm trước khi xét hoàn tất chương trình.",
    status: "reviewed",
  },
];

export function getClassroomByCode(classCode: string) {
  return classroomRecords.find((item) => item.classCode === classCode);
}

export function getStudentsByClassName(className: string) {
  return studentRecords.filter((student) => student.className === className);
}

export function getPromotionPlansByClassName(className: string) {
  return promotionPlans.filter((plan) => plan.currentClass === className);
}
