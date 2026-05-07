export type DepartmentRecord = {
  id: string;
  name: string;
  headTeacher: string;
  viceHeadTeacher: string;
  teacherCount: number;
  subjectCount: number;
};

export type TeacherAssignment = {
  academicYear: string;
  semester: string;
  className: string;
  subject: string;
  room: string;
  periods: string;
};

export type TeacherRecord = {
  id: string;
  teacherCode: string;
  fullName: string;
  department: string;
  title: string;
  phone: string;
  email: string;
  homeroomClass?: string;
  subjects: string[];
  employmentStatus: string;
  bio: string;
  assignments: TeacherAssignment[];
};

export const departmentRecords: DepartmentRecord[] = [
  {
    id: "math",
    name: "Toán",
    headTeacher: "Nguyễn Thu Hà",
    viceHeadTeacher: "Vũ Quốc Nam",
    teacherCount: 12,
    subjectCount: 2,
  },
  {
    id: "literature",
    name: "Ngữ văn",
    headTeacher: "Lê Quốc Bảo",
    viceHeadTeacher: "Trần Thanh Mai",
    teacherCount: 10,
    subjectCount: 1,
  },
  {
    id: "it",
    name: "Tin học",
    headTeacher: "Trần Minh Châu",
    viceHeadTeacher: "Phan Nhật Minh",
    teacherCount: 4,
    subjectCount: 2,
  },
];

export const teacherMetrics = [
  {
    label: "Giáo viên hoạt động",
    value: "86",
    trend: "+2",
    note: "Đã phân công đầy đủ cho các khối trong năm học hiện tại.",
  },
  {
    label: "Bộ môn đang quản lý",
    value: "8",
    trend: "Ổn định",
    note: "Bao gồm tổ Toán, Văn, Ngoại ngữ, Tin học và các tổ khác.",
  },
  {
    label: "Phân công đang mở",
    value: "47",
    trend: "+5",
    note: "Một giáo viên có thể dạy nhiều môn và nhiều lớp cùng lúc.",
  },
  {
    label: "Lịch dạy thay",
    value: "6",
    trend: "+1",
    note: "Đã phát sinh 6 điều chỉnh lịch giảng dạy trong tháng này.",
  },
];

export const teacherRecords: TeacherRecord[] = [
  {
    id: "nguyen-thu-ha",
    teacherCode: "GV020",
    fullName: "Nguyễn Thu Hà",
    department: "Toán",
    title: "Trưởng bộ môn",
    phone: "0908 118 220",
    email: "thuha.gv020@sms.edu.vn",
    homeroomClass: "10A1",
    subjects: ["Toán 10", "Toán 11"],
    employmentStatus: "Đang công tác",
    bio: "Phụ trách chuyên môn khối 10 và điều phối hoạt động tổ Toán.",
    assignments: [
      {
        academicYear: "2026 - 2027",
        semester: "Học kỳ II",
        className: "10A1",
        subject: "Toán",
        room: "A203",
        periods: "Thứ hai • Tiết 1 - 2",
      },
      {
        academicYear: "2026 - 2027",
        semester: "Học kỳ II",
        className: "10A2",
        subject: "Toán",
        room: "A205",
        periods: "Thứ tư • Tiết 3 - 4",
      },
      {
        academicYear: "2026 - 2027",
        semester: "Học kỳ II",
        className: "11A1",
        subject: "Toán",
        room: "B201",
        periods: "Thứ sáu • Tiết 1 - 3",
      },
    ],
  },
  {
    id: "le-quoc-bao",
    teacherCode: "GV031",
    fullName: "Lê Quốc Bảo",
    department: "Ngữ văn",
    title: "Trưởng bộ môn",
    phone: "0917 443 801",
    email: "quocbao.gv031@sms.edu.vn",
    homeroomClass: "11A2",
    subjects: ["Ngữ văn 10", "Ngữ văn 12"],
    employmentStatus: "Đang công tác",
    bio: "Phụ trách chuyên môn Ngữ văn và chủ nhiệm lớp 11A2.",
    assignments: [
      {
        academicYear: "2026 - 2027",
        semester: "Học kỳ II",
        className: "11A2",
        subject: "Ngữ văn",
        room: "B102",
        periods: "Thứ ba • Tiết 3 - 4",
      },
      {
        academicYear: "2026 - 2027",
        semester: "Học kỳ II",
        className: "12A1",
        subject: "Ngữ văn",
        room: "C104",
        periods: "Thứ năm • Tiết 1 - 2",
      },
    ],
  },
  {
    id: "tran-minh-chau",
    teacherCode: "GV044",
    fullName: "Trần Minh Châu",
    department: "Tin học",
    title: "Trưởng bộ môn",
    phone: "0982 055 229",
    email: "minhchau.gv044@sms.edu.vn",
    subjects: ["Tin học", "Robotics"],
    employmentStatus: "Đang công tác",
    bio: "Điều phối phòng lab và các lớp Tin học tăng cường.",
    assignments: [
      {
        academicYear: "2026 - 2027",
        semester: "Học kỳ II",
        className: "12A1",
        subject: "Tin học",
        room: "Lab 2",
        periods: "Thứ năm • Tiết 1 - 3",
      },
      {
        academicYear: "2026 - 2027",
        semester: "Học kỳ II",
        className: "11A2",
        subject: "Tin học",
        room: "Lab 1",
        periods: "Thứ sáu • Tiết 4 - 5",
      },
    ],
  },
];

export const teachingAssignments = teacherRecords.flatMap((teacher) =>
  teacher.assignments.map((assignment) => ({
    teacherName: teacher.fullName,
    teacherCode: teacher.teacherCode,
    department: teacher.department,
    ...assignment,
  })),
);

export function getTeacherByCode(teacherCode: string) {
  return teacherRecords.find((teacher) => teacher.teacherCode === teacherCode);
}
