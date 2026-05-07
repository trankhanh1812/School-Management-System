export const overviewMetrics = [
  { label: "Tổng học sinh", value: "1.248", trend: "+6.4%", note: "So với cùng kỳ năm học trước" },
  { label: "Giáo viên hoạt động", value: "86", trend: "+2", note: "Đã phân công đủ các khối" },
  { label: "Lớp đang mở", value: "32", trend: "100%", note: "Từ khối 10 đến khối 12" },
  { label: "Cảnh báo học lực", value: "54", trend: "-12%", note: "Giảm sau khảo sát giữa kỳ" },
];

export const dashboardHighlights = [
  "Quản lý năm học, học kỳ và promotion workflow được thiết kế để không ghi đè dữ liệu lịch sử.",
  "Teacher assignment tách riêng theo giáo viên, môn học, lớp học để hỗ trợ dạy nhiều môn và thay giáo viên giữa kỳ.",
  "Học bạ điện tử, điểm chính thức và điểm khảo sát có thể hiển thị chung hoặc tách dashboard theo từng mục tiêu.",
];

export const recentActivities = [
  "10A1 vừa hoàn tất nhập điểm kiểm tra 1 tiết môn Toán cho học kỳ II.",
  "Phụ huynh lớp 11A3 nhận 24 thông báo về kết quả khảo sát đầu tháng.",
  "Admin đã mở năm học 2026 - 2027 và tạo nháp promotion plan cho khối 10.",
];

export const students = [
  {
    studentCode: "HS10231",
    fullName: "Nguyễn Minh Anh",
    className: "10A1",
    academicYear: "2026 - 2027",
    conduct: "Tốt",
    scoreAverage: "8.4",
  },
  {
    studentCode: "HS10278",
    fullName: "Trần Gia Hân",
    className: "10A1",
    academicYear: "2026 - 2027",
    conduct: "Khá",
    scoreAverage: "7.6",
  },
  {
    studentCode: "HS11804",
    fullName: "Phạm Quang Huy",
    className: "11A2",
    academicYear: "2026 - 2027",
    conduct: "Tốt",
    scoreAverage: "8.9",
  },
  {
    studentCode: "HS12711",
    fullName: "Lê Hoàng Nam",
    className: "12A1",
    academicYear: "2026 - 2027",
    conduct: "Trung bình",
    scoreAverage: "5.8",
  },
];

export const teachers = [
  {
    teacherCode: "GV020",
    fullName: "Nguyễn Thu Hà",
    department: "Toán",
    subjects: "Toán 10, Toán 11",
    assignmentCount: "6 lớp",
  },
  {
    teacherCode: "GV031",
    fullName: "Lê Quốc Bảo",
    department: "Ngữ văn",
    subjects: "Ngữ văn 10, Ngữ văn 12",
    assignmentCount: "5 lớp",
  },
  {
    teacherCode: "GV044",
    fullName: "Trần Minh Châu",
    department: "Tin học",
    subjects: "Tin học, Robotics",
    assignmentCount: "4 lớp",
  },
];

export const classes = [
  {
    className: "10A1",
    grade: "Khối 10",
    homeroomTeacher: "Nguyễn Thu Hà",
    academicYear: "2026 - 2027",
    totalStudents: "41",
  },
  {
    className: "11A2",
    grade: "Khối 11",
    homeroomTeacher: "Lê Quốc Bảo",
    academicYear: "2026 - 2027",
    totalStudents: "39",
  },
  {
    className: "12A1",
    grade: "Khối 12",
    homeroomTeacher: "Phạm Hải Yến",
    academicYear: "2026 - 2027",
    totalStudents: "38",
  },
];

export const subjects = [
  { subjectCode: "MATH", subjectName: "Toán", department: "Toán", teachers: "12 giáo viên", examStructure: "Miệng / 15p / 1 tiết / HK" },
  { subjectCode: "LIT", subjectName: "Ngữ văn", department: "Ngữ văn", teachers: "10 giáo viên", examStructure: "15p / bài viết / HK" },
  { subjectCode: "ENG", subjectName: "Tiếng Anh", department: "Ngoại ngữ", teachers: "9 giáo viên", examStructure: "Quiz / Speaking / Midterm / Final" },
  { subjectCode: "IT", subjectName: "Tin học", department: "Tin học", teachers: "4 giáo viên", examStructure: "Thực hành / dự án / HK" },
];

export const scoreRows = [
  { className: "10A1", subject: "Toán", semester: "Học kỳ II", teacher: "Nguyễn Thu Hà", progress: "38/41 đã nhập", status: "Đang mở" },
  { className: "10A2", subject: "Ngữ văn", semester: "Học kỳ II", teacher: "Lê Quốc Bảo", progress: "41/41 đã nhập", status: "Đã khóa" },
  { className: "11A2", subject: "Tiếng Anh", semester: "Học kỳ II", teacher: "Đỗ Hoài An", progress: "35/39 đã nhập", status: "Chờ hoàn tất" },
];

export const attendanceRows = [
  { className: "10A1", date: "20/03/2026", attendanceRate: "95%", absentStudents: "2 học sinh", note: "1 nghỉ phép, 1 đi muộn" },
  { className: "11A2", date: "20/03/2026", attendanceRate: "100%", absentStudents: "0 học sinh", note: "Đủ sĩ số" },
  { className: "12A1", date: "20/03/2026", attendanceRate: "92%", absentStudents: "3 học sinh", note: "Có 1 trường hợp cần liên hệ phụ huynh" },
];

export const scheduleRows = [
  { day: "Thứ hai", period: "Tiết 1 - 2", className: "10A1", subject: "Toán", room: "A203", teacher: "Nguyễn Thu Hà" },
  { day: "Thứ ba", period: "Tiết 3 - 4", className: "11A2", subject: "Ngữ văn", room: "B102", teacher: "Lê Quốc Bảo" },
  { day: "Thứ năm", period: "Tiết 1 - 3", className: "12A1", subject: "Tin học", room: "Lab 2", teacher: "Trần Minh Châu" },
];

export const reportRows = [
  { reportName: "Bảng điểm lớp 10A1", scope: "Lớp học", format: "PDF / Excel", updatedAt: "19/03/2026 16:30" },
  { reportName: "Top học sinh học kỳ II", scope: "Toàn trường", format: "Dashboard / PDF", updatedAt: "20/03/2026 08:00" },
  { reportName: "Khảo sát đầu năm khối 10", scope: "Khối 10", format: "Excel", updatedAt: "18/03/2026 11:15" },
];

export const notifications = [
  { title: "Cảnh báo nhập điểm trễ hạn", audience: "Giáo viên", channel: "In-app", status: "Đang gửi" },
  { title: "Thông báo khảo sát giữa kỳ", audience: "Học sinh & Phụ huynh", channel: "Email / In-app", status: "Đã lên lịch" },
  { title: "Nhắc đóng học phí tháng 4", audience: "Phụ huynh", channel: "SMS / In-app", status: "Bản nháp" },
];
