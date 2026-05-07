export type StudentRecord = {
  id: string;
  studentCode: string;
  fullName: string;
  className: string;
  academicYear: string;
  conduct: string;
  scoreAverage: string;
  status: string;
  homeroomTeacher: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  avatarLabel: string;
  parents: {
    role: string;
    fullName: string;
    phone: string;
    email: string;
    accountStatus: string;
  }[];
  academicHistory: {
    academicYear: string;
    className: string;
    result: string;
    note: string;
  }[];
  transcript: {
    subject: string;
    semester1: string;
    semester2: string;
    yearAverage: string;
  }[];
  subjectResults: {
    academicYear: string;
    subject: string;
    teacher: string;
    semester: string;
    officialAverage: string;
    surveyAverage: string;
    rank: string;
    assessments: {
      assessmentName: string;
      category: string;
      weight: string;
      score: string;
      recordedBy: string;
      recordedAt: string;
      status: string;
    }[];
  }[];
  transcriptOverview: {
    academicYear: string;
    className: string;
    semesterAverage: string;
    yearAverage: string;
    academicRank: string;
    conduct: string;
    absences: string;
  }[];
  alerts: string[];
};

export const studentMetrics = [
  {
    label: "Tổng học sinh đang học",
    value: "1.248",
    trend: "+14",
    note: "Học sinh mới tuần này",
  },
  {
    label: "Học sinh cần theo dõi",
    value: "54",
    trend: "-12%",
    note: "Giảm so với tháng trước",
  },
  {
    label: "Phụ huynh chưa xác minh",
    value: "37",
    trend: "-6",
    note: "Tài khoản chưa xác minh email",
  },
  {
    label: "Biến động lớp học",
    value: "9",
    trend: "+2",
    note: "Thay đổi lớp trong kỳ",
  },
];

export const studentFilters = {
  academicYears: ["2026 - 2027", "2025 - 2026", "2024 - 2025"],
  grades: ["Khối 10", "Khối 11", "Khối 12"],
  statuses: ["Đang học", "Bảo lưu", "Chuyển trường", "Tốt nghiệp"],
};

export const studentRecords: StudentRecord[] = [
  {
    id: "nguyen-minh-anh",
    studentCode: "HS10231",
    fullName: "Nguyễn Minh Anh",
    className: "10A1",
    academicYear: "2026 - 2027",
    conduct: "Tốt",
    scoreAverage: "8.4",
    status: "Đang học",
    homeroomTeacher: "Nguyễn Thu Hà",
    dateOfBirth: "12/08/2010",
    gender: "Nam",
    phone: "0901 245 678",
    email: "minhanh.hs10231@sms.edu.vn",
    address: "Quận Bình Thạnh, TP. Hồ Chí Minh",
    avatarLabel: "MA",
    parents: [
      {
        role: "Mẹ",
        fullName: "Trần Thu Phương",
        phone: "0918 300 112",
        email: "phuong.parent@sms.edu.vn",
        accountStatus: "Đang hoạt động",
      },
      {
        role: "Bố",
        fullName: "Nguyễn Hải Long",
        phone: "0908 111 220",
        email: "hailong.parent@sms.edu.vn",
        accountStatus: "Đang hoạt động",
      },
    ],
    academicHistory: [
      {
        academicYear: "2024 - 2025",
        className: "8A1",
        result: "Giỏi",
        note: "Hoàn thành tốt năm học, được đề cử lớp chọn.",
      },
      {
        academicYear: "2025 - 2026",
        className: "9A1",
        result: "Giỏi",
        note: "Trúng tuyển lớp 10A1 qua kỳ đánh giá đầu vào.",
      },
      {
        academicYear: "2026 - 2027",
        className: "10A1",
        result: "Đang theo học",
        note: "Đang học kỳ II, kết quả khảo sát giữa kỳ tăng 0.6 điểm.",
      },
    ],
    transcript: [
      { subject: "Toán", semester1: "8.2", semester2: "8.6", yearAverage: "8.5" },
      { subject: "Ngữ văn", semester1: "7.5", semester2: "7.9", yearAverage: "7.8" },
      { subject: "Tiếng Anh", semester1: "8.8", semester2: "9.0", yearAverage: "8.9" },
      { subject: "Tin học", semester1: "9.1", semester2: "9.2", yearAverage: "9.2" },
    ],
    subjectResults: [
      {
        academicYear: "2026 - 2027",
        subject: "Toán",
        teacher: "Nguyễn Thu Hà",
        semester: "Học kỳ II",
        officialAverage: "8.6",
        surveyAverage: "8.1",
        rank: "Giỏi",
        assessments: [
          {
            assessmentName: "Miệng lần 1",
            category: "Chính thức",
            weight: "Hệ số 1",
            score: "8.0",
            recordedBy: "Nguyễn Thu Hà",
            recordedAt: "10/03/2026 08:15",
            status: "Đã duyệt",
          },
          {
            assessmentName: "15 phút chương 3",
            category: "Chính thức",
            weight: "Hệ số 1",
            score: "8.5",
            recordedBy: "Nguyễn Thu Hà",
            recordedAt: "12/03/2026 14:20",
            status: "Đã duyệt",
          },
          {
            assessmentName: "1 tiết giữa kỳ",
            category: "Chính thức",
            weight: "Hệ số 2",
            score: "8.8",
            recordedBy: "Nguyễn Thu Hà",
            recordedAt: "16/03/2026 09:10",
            status: "Đã duyệt",
          },
          {
            assessmentName: "Khảo sát giữa kỳ",
            category: "Khảo sát",
            weight: "Không tính học bạ",
            score: "8.1",
            recordedBy: "Tổ Toán",
            recordedAt: "18/03/2026 16:00",
            status: "Đã công bố",
          },
        ],
      },
      {
        academicYear: "2026 - 2027",
        subject: "Tiếng Anh",
        teacher: "Đỗ Hoài An",
        semester: "Học kỳ II",
        officialAverage: "9.0",
        surveyAverage: "8.7",
        rank: "Giỏi",
        assessments: [
          {
            assessmentName: "Listening quiz",
            category: "Chính thức",
            weight: "Hệ số 1",
            score: "9.0",
            recordedBy: "Đỗ Hoài An",
            recordedAt: "08/03/2026 10:30",
            status: "Đã duyệt",
          },
          {
            assessmentName: "Speaking test",
            category: "Chính thức",
            weight: "Hệ số 2",
            score: "8.8",
            recordedBy: "Đỗ Hoài An",
            recordedAt: "14/03/2026 11:45",
            status: "Đã duyệt",
          },
          {
            assessmentName: "Khảo sát đầu tháng 3",
            category: "Khảo sát",
            weight: "Không tính học bạ",
            score: "8.7",
            recordedBy: "Tổ Ngoại ngữ",
            recordedAt: "15/03/2026 15:00",
            status: "Đã công bố",
          },
        ],
      },
    ],
    transcriptOverview: [
      {
        academicYear: "2025 - 2026",
        className: "9A1",
        semesterAverage: "8.4",
        yearAverage: "8.5",
        academicRank: "Giỏi",
        conduct: "Tốt",
        absences: "2 ngày",
      },
      {
        academicYear: "2026 - 2027",
        className: "10A1",
        semesterAverage: "8.6",
        yearAverage: "8.5",
        academicRank: "Giỏi",
        conduct: "Tốt",
        absences: "1 ngày",
      },
    ],
    alerts: [
      "Đủ điều kiện xét học sinh giỏi học kỳ II.",
      "Phụ huynh đã xác nhận nhận thông báo chuyên cần và điểm số.",
    ],
  },
  {
    id: "tran-gia-han",
    studentCode: "HS10278",
    fullName: "Trần Gia Hân",
    className: "10A1",
    academicYear: "2026 - 2027",
    conduct: "Khá",
    scoreAverage: "7.6",
    status: "Đang học",
    homeroomTeacher: "Nguyễn Thu Hà",
    dateOfBirth: "05/11/2010",
    gender: "Nữ",
    phone: "0935 774 280",
    email: "giahan.hs10278@sms.edu.vn",
    address: "Thủ Đức, TP. Hồ Chí Minh",
    avatarLabel: "GH",
    parents: [
      {
        role: "Mẹ",
        fullName: "Lê Thu Hồng",
        phone: "0903 884 111",
        email: "lethuhong.parent@sms.edu.vn",
        accountStatus: "Chưa xác minh",
      },
    ],
    academicHistory: [
      {
        academicYear: "2025 - 2026",
        className: "9A2",
        result: "Khá",
        note: "Có thế mạnh ngoại ngữ và mỹ thuật.",
      },
      {
        academicYear: "2026 - 2027",
        className: "10A1",
        result: "Đang theo học",
        note: "Cần theo dõi chuyên cần trong tháng 3.",
      },
    ],
    transcript: [
      { subject: "Toán", semester1: "7.1", semester2: "7.4", yearAverage: "7.3" },
      { subject: "Ngữ văn", semester1: "8.2", semester2: "8.0", yearAverage: "8.1" },
      { subject: "Tiếng Anh", semester1: "8.6", semester2: "8.5", yearAverage: "8.5" },
      { subject: "Tin học", semester1: "7.4", semester2: "7.8", yearAverage: "7.7" },
    ],
    subjectResults: [
      {
        academicYear: "2026 - 2027",
        subject: "Ngữ văn",
        teacher: "Lê Quốc Bảo",
        semester: "Học kỳ II",
        officialAverage: "8.0",
        surveyAverage: "7.8",
        rank: "Khá",
        assessments: [
          {
            assessmentName: "Bài viết số 4",
            category: "Chính thức",
            weight: "Hệ số 2",
            score: "8.0",
            recordedBy: "Lê Quốc Bảo",
            recordedAt: "11/03/2026 09:00",
            status: "Đã duyệt",
          },
          {
            assessmentName: "Khảo sát năng lực đọc hiểu",
            category: "Khảo sát",
            weight: "Không tính học bạ",
            score: "7.8",
            recordedBy: "Tổ Ngữ văn",
            recordedAt: "17/03/2026 13:15",
            status: "Đã công bố",
          },
        ],
      },
    ],
    transcriptOverview: [
      {
        academicYear: "2026 - 2027",
        className: "10A1",
        semesterAverage: "7.8",
        yearAverage: "7.6",
        academicRank: "Khá",
        conduct: "Khá",
        absences: "4 ngày",
      },
    ],
    alerts: [
      "Tài khoản phụ huynh chưa xác minh email.",
      "Đã có 2 lần đi muộn trong 30 ngày gần nhất.",
    ],
  },
  {
    id: "pham-quang-huy",
    studentCode: "HS11804",
    fullName: "Phạm Quang Huy",
    className: "11A2",
    academicYear: "2026 - 2027",
    conduct: "Tốt",
    scoreAverage: "8.9",
    status: "Đang học",
    homeroomTeacher: "Lê Quốc Bảo",
    dateOfBirth: "22/03/2009",
    gender: "Nam",
    phone: "0973 889 003",
    email: "quanghuy.hs11804@sms.edu.vn",
    address: "Quận 7, TP. Hồ Chí Minh",
    avatarLabel: "QH",
    parents: [
      {
        role: "Người giám hộ",
        fullName: "Phạm Hải Yến",
        phone: "0908 650 888",
        email: "haiyen.parent@sms.edu.vn",
        accountStatus: "Đang hoạt động",
      },
    ],
    academicHistory: [
      {
        academicYear: "2024 - 2025",
        className: "9A3",
        result: "Giỏi",
        note: "Được chọn đội tuyển Tin học cấp trường.",
      },
      {
        academicYear: "2025 - 2026",
        className: "10A2",
        result: "Giỏi",
        note: "Chuyển sang 11A2 theo promotion plan của lớp chọn.",
      },
      {
        academicYear: "2026 - 2027",
        className: "11A2",
        result: "Đang theo học",
        note: "Top 5 toàn khối theo điểm khảo sát đầu năm.",
      },
    ],
    transcript: [
      { subject: "Toán", semester1: "9.0", semester2: "9.2", yearAverage: "9.1" },
      { subject: "Ngữ văn", semester1: "8.1", semester2: "8.4", yearAverage: "8.3" },
      { subject: "Tiếng Anh", semester1: "8.9", semester2: "9.1", yearAverage: "9.0" },
      { subject: "Tin học", semester1: "9.6", semester2: "9.8", yearAverage: "9.7" },
    ],
    subjectResults: [
      {
        academicYear: "2026 - 2027",
        subject: "Tin học",
        teacher: "Trần Minh Châu",
        semester: "Học kỳ II",
        officialAverage: "9.8",
        surveyAverage: "9.5",
        rank: "Giỏi",
        assessments: [
          {
            assessmentName: "Dự án web app",
            category: "Chính thức",
            weight: "Hệ số 2",
            score: "9.8",
            recordedBy: "Trần Minh Châu",
            recordedAt: "12/03/2026 16:20",
            status: "Đã duyệt",
          },
          {
            assessmentName: "Khảo sát thuật toán",
            category: "Khảo sát",
            weight: "Không tính học bạ",
            score: "9.5",
            recordedBy: "Tổ Tin học",
            recordedAt: "18/03/2026 10:40",
            status: "Đã công bố",
          },
        ],
      },
    ],
    transcriptOverview: [
      {
        academicYear: "2025 - 2026",
        className: "10A2",
        semesterAverage: "8.9",
        yearAverage: "9.0",
        academicRank: "Giỏi",
        conduct: "Tốt",
        absences: "1 ngày",
      },
      {
        academicYear: "2026 - 2027",
        className: "11A2",
        semesterAverage: "9.1",
        yearAverage: "8.9",
        academicRank: "Giỏi",
        conduct: "Tốt",
        absences: "0 ngày",
      },
    ],
    alerts: [
      "Đủ điều kiện đề cử học sinh xuất sắc.",
      "Tài khoản phụ huynh đồng bộ thông báo hoàn tất.",
    ],
  },
  {
    id: "le-hoang-nam",
    studentCode: "HS12711",
    fullName: "Lê Hoàng Nam",
    className: "12A1",
    academicYear: "2026 - 2027",
    conduct: "Trung bình",
    scoreAverage: "5.8",
    status: "Cần hỗ trợ",
    homeroomTeacher: "Phạm Hải Yến",
    dateOfBirth: "10/01/2008",
    gender: "Nam",
    phone: "0981 102 778",
    email: "hoangnam.hs12711@sms.edu.vn",
    address: "Quận 12, TP. Hồ Chí Minh",
    avatarLabel: "HN",
    parents: [
      {
        role: "Mẹ",
        fullName: "Đỗ Mỹ Linh",
        phone: "0902 456 999",
        email: "mylinh.parent@sms.edu.vn",
        accountStatus: "Đang hoạt động",
      },
    ],
    academicHistory: [
      {
        academicYear: "2024 - 2025",
        className: "10A1",
        result: "Khá",
        note: "Có tiến bộ tốt ở học kỳ II.",
      },
      {
        academicYear: "2025 - 2026",
        className: "11A1",
        result: "Trung bình",
        note: "Đã tham gia chương trình hỗ trợ học tập hè.",
      },
      {
        academicYear: "2026 - 2027",
        className: "12A1",
        result: "Đang theo học",
        note: "Cần theo dõi sát kết quả Toán và Vật lý trước kỳ thi tốt nghiệp.",
      },
    ],
    transcript: [
      { subject: "Toán", semester1: "5.0", semester2: "5.4", yearAverage: "5.3" },
      { subject: "Ngữ văn", semester1: "6.0", semester2: "6.3", yearAverage: "6.2" },
      { subject: "Tiếng Anh", semester1: "5.4", semester2: "5.9", yearAverage: "5.7" },
      { subject: "Tin học", semester1: "6.5", semester2: "6.2", yearAverage: "6.3" },
    ],
    subjectResults: [
      {
        academicYear: "2026 - 2027",
        subject: "Toán",
        teacher: "Phạm Hải Yến",
        semester: "Học kỳ II",
        officialAverage: "5.4",
        surveyAverage: "4.9",
        rank: "Cần hỗ trợ",
        assessments: [
          {
            assessmentName: "15 phút chương 5",
            category: "Chính thức",
            weight: "Hệ số 1",
            score: "5.0",
            recordedBy: "Phạm Hải Yến",
            recordedAt: "09/03/2026 08:00",
            status: "Đã duyệt",
          },
          {
            assessmentName: "1 tiết giữa kỳ",
            category: "Chính thức",
            weight: "Hệ số 2",
            score: "5.5",
            recordedBy: "Phạm Hải Yến",
            recordedAt: "15/03/2026 14:15",
            status: "Đã duyệt",
          },
          {
            assessmentName: "Khảo sát ôn thi",
            category: "Khảo sát",
            weight: "Không tính học bạ",
            score: "4.9",
            recordedBy: "Tổ Toán",
            recordedAt: "19/03/2026 17:20",
            status: "Đã công bố",
          },
        ],
      },
    ],
    transcriptOverview: [
      {
        academicYear: "2025 - 2026",
        className: "11A1",
        semesterAverage: "6.1",
        yearAverage: "6.0",
        academicRank: "Trung bình",
        conduct: "Khá",
        absences: "5 ngày",
      },
      {
        academicYear: "2026 - 2027",
        className: "12A1",
        semesterAverage: "5.8",
        yearAverage: "5.8",
        academicRank: "Trung bình",
        conduct: "Trung bình",
        absences: "6 ngày",
      },
    ],
    alerts: [
      "Học sinh nằm trong nhóm cần hỗ trợ trước kỳ thi tốt nghiệp.",
      "Đã gửi cảnh báo học lực đến phụ huynh ngày 18/03/2026.",
    ],
  },
];

export function getStudentByCode(studentCode: string) {
  return studentRecords.find((student) => student.studentCode === studentCode);
}
