import { teachingAssignments } from "@/features/teacher/teacher-data";

export type ScheduleConflict = {
  id: string;
  type: "teacher" | "classroom" | "room";
  severity: "high" | "medium";
  title: string;
  description: string;
  affectedItems: string[];
  recommendation: string;
};

export const scheduleMetrics = [
  {
    label: "Ca học đang vận hành",
    value: String(teachingAssignments.length),
    trend: "+3",
    note: "Tính trên teaching assignment hiện có trong năm học hiện tại.",
  },
  {
    label: "Conflict đang mở",
    value: "3",
    trend: "-1",
    note: "Bao gồm conflict giáo viên, lớp và phòng học cần xử lý.",
  },
  {
    label: "Lịch dạy thay",
    value: "6",
    trend: "+1",
    note: "Đang có 6 thay đổi lịch dạy trong tháng.",
  },
  {
    label: "Phòng lab dùng chung",
    value: "2",
    trend: "Cao tải",
    note: "Lab 1 và Lab 2 thường xuyên phát sinh trùng lịch khi cao điểm.",
  },
];

export const scheduleRows = teachingAssignments.map((assignment) => ({
  academicYear: assignment.academicYear,
  semester: assignment.semester,
  teacherName: assignment.teacherName,
  className: assignment.className,
  subject: assignment.subject,
  room: assignment.room,
  periods: assignment.periods,
  status: assignment.room.includes("Lab") ? "Cần theo dõi" : "Ổn định",
}));

export const scheduleConflicts: ScheduleConflict[] = [
  {
    id: "teacher-1",
    type: "teacher",
    severity: "high",
    title: "Giáo viên trùng lịch cùng khung giờ",
    description:
      "Nguyễn Thu Hà đang được gán dạy Toán cho 10A1 và 10A2 trong cùng buổi nếu thêm ca bù chiều thứ hai.",
    affectedItems: ["Nguyễn Thu Hà", "10A1", "10A2"],
    recommendation: "Chuyển một ca sang chiều thứ ba hoặc gán giáo viên hỗ trợ.",
  },
  {
    id: "room-1",
    type: "room",
    severity: "medium",
    title: "Phòng Lab 2 bị dùng trùng",
    description:
      "Lab 2 đang được đề xuất cho cả Tin học 12A1 và Robotics 11A2 trong cùng khung thứ năm.",
    affectedItems: ["Lab 2", "12A1", "11A2"],
    recommendation: "Đổi 11A2 sang Lab 1 hoặc dời Robotics sang tiết 4 - 5.",
  },
  {
    id: "class-1",
    type: "classroom",
    severity: "medium",
    title: "Lớp 11A2 quá tải trong một ngày",
    description:
      "11A2 hiện có 3 môn nặng liên tiếp trong ngày thứ ba, ảnh hưởng trải nghiệm học tập.",
    affectedItems: ["11A2", "Ngữ văn", "Tin học"],
    recommendation: "Dàn lại tiết để xen kẽ môn lý thuyết và thực hành.",
  },
];

export const scheduleTemplates = [
  {
    name: "Khung sáng khối 10",
    description: "Ưu tiên Toán, Văn, Anh vào đầu tuần và xen kẽ tiết thực hành.",
  },
  {
    name: "Khung ôn thi khối 12",
    description: "Tăng số tiết môn trọng điểm và gom các lớp phụ đạo vào cuối ngày.",
  },
  {
    name: "Khung phòng lab",
    description: "Điều phối Lab 1 và Lab 2 theo luồng Tin học, Robotics và dự án.",
  },
];
