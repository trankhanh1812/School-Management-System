export const appModules = [
  {
    title: "Dashboard & Overview",
    description:
      "Tổng quan hệ thống, KPI theo năm học, cảnh báo học tập và luồng điều hành chính.",
    href: "/dashboard",
  },
  {
    title: "Students & Transcript",
    description:
      "Quản lý hồ sơ, quá trình học theo từng năm học, học bạ và kết quả từng kỳ.",
    href: "/students",
  },
  {
    title: "Teaching & Scoring",
    description:
      "Phân công giáo viên, môn học, lớp học, đầu điểm chính thức và các đợt khảo sát.",
    href: "/scores/gradebook",
  },
  {
    title: "Student Conduct",
    description:
      "Quản lý hạnh kiểm theo học sinh trong cùng luồng hồ sơ học tập, kèm nhận xét và theo dõi theo học kỳ.",
    href: "/students",
  },
  {
    title: "Reports & Notifications",
    description:
      "Dashboard, thống kê học lực, audit log và kênh thông báo đến giáo viên, học sinh, phụ huynh.",
    href: "/reports",
  },
];

export const authLinks = [
  { label: "Đăng nhập", href: "/login" },
  { label: "Đăng ký", href: "/register" },
  { label: "Quên mật khẩu", href: "/forgot-password" },
  { label: "Đặt lại mật khẩu", href: "/reset-password" },
];

// Admin and Teacher navigation
export const dashboardLinks = [
  { label: "Tổng quan", href: "/dashboard" },
  { label: "Học sinh", href: "/students" },
  { label: "Giáo viên", href: "/teachers" },
  { label: "Lớp học", href: "/classes" },
  { label: "Môn học", href: "/subjects" },
  { label: "Phân công", href: "/teaching-assignments" },
  { label: "Điểm số", href: "/scores" },
  { label: "Điểm danh", href: "/attendance" },
  { label: "Thời khóa biểu", href: "/schedule" },
  { label: "Báo cáo", href: "/reports" },
  { label: "Thông báo", href: "/notifications" },
  { label: "Cấu hình", href: "/system-settings" },
];

// Teacher specific navigation
export const teacherDashboardLinks = [
  { label: "Tổng quan", href: "/dashboard" },
  { label: "Học sinh", href: "/students" },
  { label: "Phân công", href: "/teaching-assignments" },
  { label: "Điểm số", href: "/scores" },
  { label: "Điểm danh", href: "/attendance" },
  { label: "Thời khóa biểu", href: "/schedule" },
  { label: "Báo cáo", href: "/reports" },
  { label: "Thông báo", href: "/notifications" },
];

// Student navigation
export const studentDashboardLinks = [
  { label: "Hồ sơ cá nhân", href: "/my-profile" },
  { label: "Điểm số", href: "/my-scores" },
  { label: "Lịch thi", href: "/my-exams" },
  { label: "Học bạ", href: "/my-transcript" },
  { label: "Hạnh kiểm", href: "/my-conduct" },
  { label: "Điểm danh", href: "/my-attendance" },
  { label: "Thời khóa biểu", href: "/my-schedule" },
  { label: "Thông báo", href: "/notifications" },
  { label: "Chat", href: "/chat" },
];

// Parent navigation
export const parentDashboardLinks = [
  { label: "Hồ sơ con em", href: "/my-profile" },
  { label: "Điểm số", href: "/my-scores" },
  { label: "Lịch thi", href: "/my-exams" },
  { label: "Học bạ", href: "/my-transcript" },
  { label: "Hạnh kiểm", href: "/my-conduct" },
  { label: "Điểm danh", href: "/my-attendance" },
  { label: "Thời khóa biểu", href: "/my-schedule" },
  { label: "Thông báo", href: "/notifications" },
  { label: "Chat", href: "/chat" },
];
