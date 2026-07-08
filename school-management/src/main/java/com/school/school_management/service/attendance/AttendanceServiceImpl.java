package com.school.school_management.service.attendance;

import com.school.school_management.dto.attendance.AttendanceResponse;
import com.school.school_management.dto.attendance.AttendanceUpsertRequest;
import com.school.school_management.dto.attendance.QRAttendanceRequest;
import com.school.school_management.dto.attendance.QRConfirmRequest;
import com.school.school_management.dto.attendance.QRConfirmResponse;
import com.school.school_management.dto.system.SystemSettingResponse;
import com.school.school_management.entity.Attendance;
import com.school.school_management.entity.ClassSession;
import com.school.school_management.entity.Parent;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Semester;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.AttendanceRepository;
import com.school.school_management.repository.ClassSessionRepository;
import com.school.school_management.repository.ParentRepository;
import com.school.school_management.repository.ParentStudentRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.SemesterRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.notification.NotificationAutomationService;
import com.school.school_management.service.system.SystemSettingService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private static final String MANUAL = "MANUAL";
    private static final String QR = "QR";
    private static final String PRESENT = "PRESENT";
    private static final String ABSENT = "ABSENT";
    private static final String LATE = "LATE";
    private static final String EXCUSED = "EXCUSED";

    private final AttendanceRepository attendanceRepository;
    private final ClassSessionRepository classSessionRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final ParentRepository parentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SemesterRepository semesterRepository;
    private final SystemSettingService systemSettingService;
    private final NotificationAutomationService notificationAutomationService;
    private final QRTokenService qrTokenService;

    @Value("${app.url:http://localhost:3000}")
    private String appUrl;

    public AttendanceServiceImpl(
            AttendanceRepository attendanceRepository,
            ClassSessionRepository classSessionRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            ParentStudentRepository parentStudentRepository,
            ParentRepository parentRepository,
            SchoolClassRepository schoolClassRepository,
            SemesterRepository semesterRepository,
            SystemSettingService systemSettingService,
            NotificationAutomationService notificationAutomationService,
            QRTokenService qrTokenService) {
        this.attendanceRepository = attendanceRepository;
        this.classSessionRepository = classSessionRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.parentRepository = parentRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.semesterRepository = semesterRepository;
        this.systemSettingService = systemSettingService;
        this.notificationAutomationService = notificationAutomationService;
        this.qrTokenService = qrTokenService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> listAttendance() {
        return attendanceRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public AttendanceResponse recordManualAttendance(AttendanceUpsertRequest request) {
        validateStatus(request.getStatus());
        validateMethod(request.getMethod());

        Student student = resolveStudent(request.getStudentCode());
        ClassSession session = resolveSession(request.getSessionId());
        assertCurrentUserCanCreateAttendanceForSession(session);
        // captured_by is always the authenticated user who actually entered the record,
        // never a client-supplied code (which could misattribute the entry).
        User capturedBy = getCurrentUser();

        // Check if student already has attendance for this session
        attendanceRepository.findByStudentAndSession(student, session).ifPresent(existing -> {
            throw new CustomException("Student already has attendance record for this session", 409);
        });

        Attendance saved = persistAttendance(student, session,
            request.getStatus().toUpperCase(Locale.ROOT), MANUAL, capturedBy);
        pushAttendanceNotification(saved, "Điểm danh cập nhật", "Điểm danh đã được cập nhật thủ công");
        return toResponse(saved);
    }

    @Override
    public AttendanceResponse recordQRAttendance(QRAttendanceRequest request) {
        // Bind to the authenticated student — never trust a studentCode from the request
        // body, otherwise a logged-in student could check in as anyone else.
        User currentUser = getCurrentUser();
        Student student = studentRepository.findByUserAndDeletedAtIsNull(currentUser)
            .orElseThrow(() -> new CustomException("Student profile not found for current user", 403));

        SystemSettingResponse settings = systemSettingService.getSettings();

        // Verify the request originates from the school network using the server-resolved
        // client IP. A client-supplied IP would defeat the whitelist entirely.
        verifyClientIP(resolveClientIpFromContext(), settings.getAllowedSchoolIps());

        // Decode and validate QR data
        Map<String, Object> qrData = decodeQRData(request.getQrData());
        String sessionId = (String) qrData.get("sessionId");
        Long expiryTimestamp = (Long) qrData.get("expiryTimestamp");
        if (sessionId == null || expiryTimestamp == null) {
            throw new CustomException("Invalid QR code", 400);
        }

        // Check if QR has expired
        if (System.currentTimeMillis() > expiryTimestamp) {
            throw new CustomException("QR code has expired", 400);
        }

        ClassSession session = resolveSession(sessionId);
        // Spec: QR is also invalid once the class session has ended.
        if (session.getEndTime() != null && OffsetDateTime.now().isAfter(session.getEndTime())) {
            throw new CustomException("QR code has expired", 400);
        }

        // Check if student already has attendance for this session
        attendanceRepository.findByStudentAndSession(student, session).ifPresent(existing -> {
            throw new CustomException("Student already checked in for this session", 409);
        });

        // Create attendance record for QR (no captured_by user, auto PRESENT)
        Attendance saved = persistAttendance(student, session, PRESENT, QR, null);
        pushAttendanceNotification(saved, "Điểm danh QR thành công", "Học sinh đã check-in bằng QR");
        return toResponse(saved);
    }

    @Override
    public String generateQRCode(String sessionId) {
        ClassSession session = resolveSession(sessionId);
        assertCurrentUserCanCreateAttendanceForSession(session);

        // Generate short-lived JWT token and return deep-link URL
        String qrToken = qrTokenService.generateToken(sessionId);
        return appUrl + "/attend?token=" + qrToken;
    }

    @Override
    public QRConfirmResponse confirmQRAttendance(QRConfirmRequest request) {
        // 1. Verify token and extract sessionId
        String sessionId = qrTokenService.extractSessionId(request.getToken());

        // 2. Resolve session
        ClassSession session = resolveSession(sessionId);
        // Spec: QR is also invalid once the class session has ended.
        if (session.getEndTime() != null && OffsetDateTime.now().isAfter(session.getEndTime())) {
            throw new CustomException("Mã QR đã hết hạn.", 400);
        }

        // 3. Resolve the currently authenticated student
        User currentUser = getCurrentUser();
        Student student = studentRepository.findByUserAndDeletedAtIsNull(currentUser)
            .orElseThrow(() -> new CustomException("Student profile not found for current user", 403));

        // 4. Verify IP is in allowed school network
        SystemSettingResponse settings = systemSettingService.getSettings();
        String clientIp = resolveClientIpFromContext();
        verifyClientIP(clientIp, settings.getAllowedSchoolIps());

        // 5. Check already checked in
        if (attendanceRepository.findByStudentAndSession(student, session).isPresent()) {
            throw new CustomException("Bạn đã điểm danh cho buổi học này rồi.", 409);
        }

        // 6. Create attendance record
        Attendance saved = persistAttendance(student, session, PRESENT, QR, null);
        pushAttendanceNotification(saved, "Điểm danh QR thành công", "Học sinh đã check-in bằng QR");

        return QRConfirmResponse.builder()
            .sessionId(sessionId)
            .subjectName(session.getSubject().getName())
            .className(session.getSchoolClass().getClassCode())
            .status(PRESENT)
            .method(QR)
            .build();
    }

    private String resolveClientIpFromContext() {
        try {
            Object ip = org.springframework.web.context.request.RequestContextHolder
                .currentRequestAttributes()
                .getAttribute("clientIp", org.springframework.web.context.request.RequestAttributes.SCOPE_REQUEST);
            return ip instanceof String s ? s : "";
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getSessionAttendance(String sessionId) {
        ClassSession session = resolveSession(sessionId);
        return attendanceRepository.findBySessionOrderByCreatedAtDesc(session).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getStudentAttendance(String studentCode) {
        Student student = resolveStudent(studentCode);
        assertCanViewStudentAttendance(student);
        return attendanceRepository.findByStudent(student).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendance() {
        Student student = resolveCurrentStudent();
        // Reuse the existing history logic (ownership check inside passes for the owner).
        return getStudentAttendance(student.getStudentCode());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMyAttendanceStats(OffsetDateTime startDate, OffsetDateTime endDate) {
        Student student = resolveCurrentStudent();
        // Reuse the existing stats logic.
        return getAttendanceStats(student.getStudentCode(), startDate, endDate);
    }

    /** Resolve the currently authenticated user's student profile from the JWT. */
    private Student resolveCurrentStudent() {
        User currentUser = getCurrentUser();
        return studentRepository.findByUserAndDeletedAtIsNull(currentUser)
            .orElseThrow(() -> new CustomException("Student profile not found for current user", 403));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByDateRange(String studentCode, OffsetDateTime startDate, OffsetDateTime endDate) {
        Student student = resolveStudent(studentCode);
        assertCanViewStudentAttendance(student);
        return attendanceRepository.findByStudentAndSession_StartTimeGreaterThanEqualAndSession_StartTimeLessThan(
                student, startDate, endDate
            ).stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public AttendanceResponse updateAttendance(String attendanceId, String newStatus) {
        validateStatus(newStatus);

        UUID id;
        try {
            id = UUID.fromString(attendanceId);
        } catch (IllegalArgumentException e) {
            throw new CustomException("Invalid attendance ID", 400);
        }

        Attendance attendance = attendanceRepository.findById(id)
            .orElseThrow(() -> new CustomException("Attendance record not found", 404));

        // Verify current user is teacher of the session
        User currentUser = getCurrentUser();
        ClassSession session = attendance.getSession();
        if (session.getTeacher() == null || !session.getTeacher().getUser().getId().equals(currentUser.getId())) {
            // Only teacher of the session or admin can update
            if (!isCurrentUserAdmin()) {
                throw new CustomException("Only the assigned teacher or admin can update attendance", 403);
            }
        }

        attendance.setStatus(newStatus.toUpperCase(Locale.ROOT));
        Attendance saved = attendanceRepository.save(attendance);
        pushAttendanceNotification(saved, "Điểm danh được điều chỉnh", "Trạng thái điểm danh đã được thay đổi");
        return toResponse(saved);
    }

    private void pushAttendanceNotification(Attendance attendance, String title, String actionLabel) {
        List<User> recipients = resolveAttendanceAudience(attendance);
        if (recipients.isEmpty()) {
            return;
        }

        String classCode = attendance.getSession() != null && attendance.getSession().getSchoolClass() != null
            ? attendance.getSession().getSchoolClass().getClassCode()
            : "N/A";
        String subjectCode = attendance.getSession() != null && attendance.getSession().getSubject() != null
            ? attendance.getSession().getSubject().getCode()
            : "N/A";
        String studentCode = attendance.getStudent() != null ? attendance.getStudent().getStudentCode() : "N/A";

        notificationAutomationService.notifyUsers(
            recipients,
            title,
            String.format(
                "%s: học sinh %s, lớp %s, môn %s, trạng thái %s.",
                actionLabel,
                studentCode,
                classCode,
                subjectCode,
                attendance.getStatus()
            ),
            "ATTENDANCE"
        );
    }

    private List<User> resolveAttendanceAudience(Attendance attendance) {
        java.util.LinkedHashMap<UUID, User> recipients = new java.util.LinkedHashMap<>();
        if (attendance.getStudent() != null && attendance.getStudent().getUser() != null && attendance.getStudent().getUser().getDeletedAt() == null) {
            recipients.put(attendance.getStudent().getUser().getId(), attendance.getStudent().getUser());
        }

        if (attendance.getStudent() != null) {
            List<ParentStudent> links = parentStudentRepository.findByStudentIn(List.of(attendance.getStudent()));
            for (ParentStudent link : links) {
                if (link.getParent() != null && link.getParent().getUser() != null && link.getParent().getUser().getDeletedAt() == null) {
                    recipients.put(link.getParent().getUser().getId(), link.getParent().getUser());
                }
            }
        }

        return new java.util.ArrayList<>(recipients.values());
    }

    @Override
    public void deleteAttendance(String attendanceId) {
        UUID id;
        try {
            id = UUID.fromString(attendanceId);
        } catch (IllegalArgumentException e) {
            throw new CustomException("Invalid attendance ID", 400);
        }

        Attendance attendance = attendanceRepository.findById(id)
            .orElseThrow(() -> new CustomException("Attendance record not found", 404));

        // Verify authorization
        User currentUser = getCurrentUser();
        ClassSession session = attendance.getSession();
        if (session.getTeacher() == null || !session.getTeacher().getUser().getId().equals(currentUser.getId())) {
            if (!isCurrentUserAdmin()) {
                throw new CustomException("Only the assigned teacher or admin can delete attendance", 403);
            }
        }

        // Soft delete (spec: no physical deletes). @SQLRestriction on the entity keeps
        // the deleted row out of all subsequent reads.
        attendance.setDeletedAt(OffsetDateTime.now());
        attendance.setDeletedBy(currentUser.getId());
        attendanceRepository.save(attendance);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClassSessions(String classCode, String semesterCode, LocalDate date) {
        SchoolClass schoolClass = schoolClassRepository.findByClassCodeAndDeletedAtIsNull(classCode.trim().toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Class not found", 404));

        List<ClassSession> sessions;
        if (semesterCode != null && !semesterCode.isBlank()) {
            Semester semester = resolveSemester(semesterCode);
            sessions = classSessionRepository.findBySchoolClassAndSemesterAndDeletedAtIsNullOrderByStartTimeDesc(schoolClass, semester);
        } else {
            sessions = classSessionRepository.findBySchoolClassAndDeletedAtIsNullOrderByStartTimeDesc(schoolClass);
        }

        if (date != null) {
            sessions = sessions.stream()
                .filter(session -> session.getStartTime() != null && date.equals(session.getStartTime().toLocalDate()))
                .toList();
        }

        if (!isCurrentUserAdmin()) {
            User currentUser = getCurrentUser();
            sessions = sessions.stream()
                .filter(session -> session.getTeacher() != null
                    && session.getTeacher().getUser() != null
                    && session.getTeacher().getUser().getId().equals(currentUser.getId()))
                .toList();
        }

        return sessions.stream().map(session -> {
            Map<String, Object> data = new HashMap<>();
            data.put("sessionId", session.getId().toString());
            data.put("className", session.getSchoolClass().getClassCode());
            data.put("subjectCode", session.getSubject().getCode());
            data.put("subjectName", session.getSubject().getName());
            data.put("semesterCode", session.getSemester() != null ? session.getSemester().getCode() : null);
            data.put("academicYearCode", session.getSemester() != null && session.getSemester().getAcademicYear() != null
                ? session.getSemester().getAcademicYear().getCode()
                : null);
            data.put("startTime", session.getStartTime());
            data.put("endTime", session.getEndTime());
            data.put("teacherCode", session.getTeacher() != null && session.getTeacher().getUser() != null ? session.getTeacher().getUser().getEmail() : null);
            data.put("teacherName", session.getTeacher() != null && session.getTeacher().getUser() != null ? session.getTeacher().getUser().getFullName() : null);
            data.put("periodLabel", toPeriodLabel(session.getStartTime()));
            data.put("isCurrentSlot", isCurrentSlot(session));
            return data;
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentTeacherSessionNow() {
        User currentUser = getCurrentUser();
        OffsetDateTime now = OffsetDateTime.now();

        List<ClassSession> sessions = classSessionRepository.findByDeletedAtIsNullOrderByStartTimeDesc().stream()
            .filter(session -> session.getTeacher() != null
                && session.getTeacher().getUser() != null
                && session.getTeacher().getUser().getId().equals(currentUser.getId()))
            .filter(this::isCurrentSlot)
            .toList();

        if (sessions.isEmpty()) {
            return Map.of("hasCurrentSlot", false);
        }

        ClassSession session = sessions.get(0);
        Map<String, Object> data = new HashMap<>();
        data.put("hasCurrentSlot", true);
        data.put("sessionId", session.getId().toString());
        data.put("className", session.getSchoolClass().getClassCode());
        data.put("subjectCode", session.getSubject().getCode());
        data.put("subjectName", session.getSubject().getName());
        data.put("semesterCode", session.getSemester() != null ? session.getSemester().getCode() : null);
        data.put("academicYearCode", session.getSemester() != null && session.getSemester().getAcademicYear() != null
            ? session.getSemester().getAcademicYear().getCode()
            : null);
        data.put("startTime", session.getStartTime());
        data.put("endTime", session.getEndTime());
        data.put("teacherCode", currentUser.getEmail());
        data.put("teacherName", currentUser.getFullName());
        data.put("periodLabel", toPeriodLabel(session.getStartTime()));
        data.put("date", session.getStartTime() != null ? session.getStartTime().toLocalDate().toString() : LocalDate.now().toString());
        data.put("isCurrentSlot", true);
        data.put("serverTime", now.toString());
        return data;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAttendanceStats(String studentCode, OffsetDateTime startDate, OffsetDateTime endDate) {
        Student student = resolveStudent(studentCode);
        assertCanViewStudentAttendance(student);
        List<Attendance> records = attendanceRepository.findByStudentAndSession_StartTimeGreaterThanEqualAndSession_StartTimeLessThan(
            student, startDate, endDate
        );

        long presentCount = records.stream().filter(r -> PRESENT.equals(r.getStatus())).count();
        long absentCount = records.stream().filter(r -> ABSENT.equals(r.getStatus())).count();
        long lateCount = records.stream().filter(r -> LATE.equals(r.getStatus())).count();
        long excusedCount = records.stream().filter(r -> EXCUSED.equals(r.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", records.size());
        stats.put("presentCount", presentCount);
        stats.put("absentCount", absentCount);
        stats.put("lateCount", lateCount);
        stats.put("excusedCount", excusedCount);
        stats.put("presentRate", records.isEmpty() ? 0 : (double) presentCount / records.size());

        return stats;
    }

    // Helper methods

    private void validateStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new CustomException("Status is required", 400);
        }
        String upperStatus = status.toUpperCase(Locale.ROOT);
        if (!upperStatus.matches("PRESENT|ABSENT|LATE|EXCUSED")) {
            throw new CustomException("Invalid status. Allowed: PRESENT, ABSENT, LATE, EXCUSED", 400);
        }
    }

    private void validateMethod(String method) {
        if (method == null || method.isBlank()) {
            throw new CustomException("Method is required", 400);
        }
        String upperMethod = method.toUpperCase(Locale.ROOT);
        if (!upperMethod.equals(MANUAL) && !upperMethod.equals(QR)) {
            throw new CustomException("Invalid method. Allowed: MANUAL, QR", 400);
        }
    }

    private void verifyClientIP(String clientIp, List<String> allowedIps) {
        // No whitelist configured = allow QR attendance from any IP.
        if (allowedIps == null || allowedIps.isEmpty()) {
            return;
        }

        if (clientIp == null || clientIp.isBlank()) {
            throw new CustomException("Client IP is required for QR attendance", 400);
        }

        String normalizedClientIp = clientIp.split(",")[0].trim();

        boolean isAllowed = allowedIps.stream()
            .anyMatch(allowedIp -> isIpInRange(normalizedClientIp, allowedIp));

        if (!isAllowed) {
            throw new CustomException("Your IP address is not authorized for QR attendance", 403);
        }
    }

    private boolean isIpInRange(String ip, String cidr) {
        if (ip == null || ip.isBlank() || cidr == null || cidr.isBlank()) {
            return false;
        }

        String normalizedIp = ip.trim();
        String normalizedCidr = cidr.trim();

        if (!normalizedCidr.contains("/")) {
            return normalizedIp.equals(normalizedCidr);
        }

        String[] parts = normalizedCidr.split("/");
        if (parts.length != 2) {
            return false;
        }

        long ipLong = toIpv4Long(normalizedIp);
        long networkLong = toIpv4Long(parts[0].trim());
        if (ipLong < 0 || networkLong < 0) {
            return false;
        }

        int prefixLength;
        try {
            prefixLength = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException ex) {
            return false;
        }

        if (prefixLength < 0 || prefixLength > 32) {
            return false;
        }

        if (prefixLength == 0) {
            return true;
        }

        long mask = (0xFFFFFFFFL << (32 - prefixLength)) & 0xFFFFFFFFL;
        return (ipLong & mask) == (networkLong & mask);
    }

    private long toIpv4Long(String ip) {
        String[] octets = ip.split("\\.");
        if (octets.length != 4) {
            return -1;
        }

        long result = 0;
        for (String octet : octets) {
            int value;
            try {
                value = Integer.parseInt(octet);
            } catch (NumberFormatException ex) {
                return -1;
            }

            if (value < 0 || value > 255) {
                return -1;
            }

            result = (result << 8) | value;
        }

        return result;
    }

    private Map<String, Object> decodeQRData(String qrCode) {
        try {
            byte[] decodedBytes = Base64.getDecoder().decode(qrCode);
            String json = new String(decodedBytes, StandardCharsets.UTF_8);
            // Simple JSON parsing (in production, use proper JSON library)
            Map<String, Object> data = new HashMap<>();
            // Extract sessionId and expiryTimestamp
            String[] parts = json.split(",");
            for (String part : parts) {
                if (part.contains("sessionId")) {
                    data.put("sessionId", part.split(":")[1].replaceAll("[\"\\s]", ""));
                }
                if (part.contains("expiryTimestamp")) {
                    String normalizedTimestamp = part.split(":")[1].replaceAll("[\"\\s]", "");
                    data.put("expiryTimestamp", Long.valueOf(normalizedTimestamp));
                }
            }
            return data;
        } catch (IllegalArgumentException | ArrayIndexOutOfBoundsException e) {
            throw new CustomException("Invalid QR code data", 400);
        }
    }

    private String convertToJson(Map<String, Object> data) {
        // Simple JSON conversion
        StringBuilder sb = new StringBuilder("{");
        data.forEach((key, value) -> {
            if (sb.length() > 1) sb.append(",");
            sb.append("\"").append(key).append("\":").append(value);
        });
        sb.append("}");
        return sb.toString();
    }

    private Student resolveStudent(String studentCode) {
        return studentRepository.findByStudentCodeAndDeletedAtIsNull(studentCode.trim().toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Student not found", 404));
    }

    private ClassSession resolveSession(String sessionId) {
        UUID id;
        try {
            id = UUID.fromString(sessionId);
        } catch (IllegalArgumentException e) {
            throw new CustomException("Invalid session ID", 400);
        }
        return classSessionRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new CustomException("Session not found", 404));
    }

    private User resolveUserByCode(String userCode) {
        return userRepository.findByEmail(userCode.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("User not found", 404));
    }

    private Semester resolveSemester(String semesterCode) {
        String normalizedSemesterCode = semesterCode.trim().toUpperCase(Locale.ROOT);
        // Mã học kỳ (vd "HK1") lặp lại qua từng năm học, nên findFirst() dễ vớ
        // nhầm HK1 của năm cũ -> lọc session ra rỗng. Chọn theo năm học GẦN NHẤT,
        // khớp với cách resolve lớp (findByClassCode... cũng lấy năm mới nhất).
        return semesterRepository.findAll().stream()
            .filter(semester -> semester.getCode() != null && normalizedSemesterCode.equalsIgnoreCase(semester.getCode()))
            .max(java.util.Comparator.comparing(semester ->
                semester.getAcademicYear() != null && semester.getAcademicYear().getStartDate() != null
                    ? semester.getAcademicYear().getStartDate()
                    : java.time.LocalDate.MIN))
            .orElseThrow(() -> new CustomException("Semester not found", 404));
    }

    private void assertCurrentUserCanCreateAttendanceForSession(ClassSession session) {
        if (isCurrentUserAdmin()) {
            return;
        }

        User currentUser = getCurrentUser();
        if (session.getTeacher() == null || session.getTeacher().getUser() == null
                || !session.getTeacher().getUser().getId().equals(currentUser.getId())) {
            throw new CustomException("Only the assigned teacher can create attendance for this session", 403);
        }

        if (!isCurrentSlot(session)) {
            throw new CustomException("Attendance can only be created during the teacher's current class slot", 403);
        }
    }

    private boolean isCurrentSlot(ClassSession session) {
        if (session == null || session.getStartTime() == null || session.getEndTime() == null) {
            return false;
        }

        OffsetDateTime now = OffsetDateTime.now();
        return !now.isBefore(session.getStartTime()) && !now.isAfter(session.getEndTime());
    }

    private String toPeriodLabel(OffsetDateTime startTime) {
        if (startTime == null) {
            return "Tiết chưa xác định";
        }

        int hour = startTime.getHour();
        int minute = startTime.getMinute();
        int total = hour * 60 + minute;

        if (total < 6 * 60 + 30) {
            return "Tiết 1";
        }
        if (total < 7 * 60 + 20) {
            return "Tiết 1";
        }
        if (total < 8 * 60 + 10) {
            return "Tiết 2";
        }
        if (total < 9 * 60) {
            return "Tiết 3";
        }
        if (total < 9 * 60 + 50) {
            return "Tiết 4";
        }
        return "Tiết 5";
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new CustomException("Unauthenticated", 401);
        }

        String email = authentication.getName().trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException("Current user not found", 404));
    }

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch("ROLE_ADMIN"::equals);
    }

    /**
     * Ownership guard for reading a student's attendance.
     * ADMIN/TEACHER: allowed. PARENT: only if linked to the student.
     * STUDENT: only their own record (prevents IDOR via a different studentCode).
     */
    private void assertCanViewStudentAttendance(Student student) {
        if (isCurrentUserAdmin()) {
            return;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new CustomException("Unauthenticated", 401);
        }
        boolean isTeacher = auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_TEACHER".equals(a.getAuthority()));
        if (isTeacher) {
            return;
        }
        boolean isParent = auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_PARENT".equals(a.getAuthority()));
        User currentUser = getCurrentUser();
        if (isParent) {
            Parent parent = parentRepository.findByUser(currentUser)
                .orElseThrow(() -> new CustomException("Parent profile not found", 403));
            if (parentStudentRepository.findByParentAndStudent(parent, student).isEmpty()) {
                throw new CustomException("Forbidden", 403);
            }
            return;
        }
        // STUDENT (or any other role): only their own attendance.
        if (student.getUser() == null || !student.getUser().getId().equals(currentUser.getId())) {
            throw new CustomException("Forbidden", 403);
        }
    }

    /**
     * Creates the attendance row, or REUSES an existing one (including a soft-deleted row)
     * for the same student+session. Reusing avoids a unique-constraint violation on
     * re-marking after a soft delete (the @SQLRestriction hides the deleted row from
     * normal reads, so a plain insert would collide).
     */
    private Attendance persistAttendance(Student student, ClassSession session,
                                         String status, String method, User capturedBy) {
        Attendance attendance = attendanceRepository
            .findAnyByStudentAndSession(student.getId(), session.getId())
            .orElseGet(() -> Attendance.builder().student(student).session(session).build());
        attendance.setStatus(status);
        attendance.setMethod(method);
        attendance.setCapturedBy(capturedBy);
        // Undelete if this was a previously soft-deleted record.
        attendance.setDeletedAt(null);
        attendance.setDeletedBy(null);
        return attendanceRepository.save(attendance);
    }

    private AttendanceResponse toResponse(Attendance attendance) {
        ClassSession session = attendance.getSession();
        String capturedByCode = null;
        String capturedByName = null;

        if (attendance.getCapturedBy() != null) {
            capturedByCode = attendance.getCapturedBy().getEmail();
            capturedByName = attendance.getCapturedBy().getFullName();
        }

        // A session may have no assigned teacher yet (e.g. admin-entered attendance);
        // guard the teacher chain so mapping never NPEs.
        String teacherCode = null;
        String teacherName = null;
        if (session.getTeacher() != null && session.getTeacher().getUser() != null) {
            teacherCode = session.getTeacher().getUser().getEmail();
            teacherName = session.getTeacher().getUser().getFullName();
        }

        return AttendanceResponse.builder()
            .attendanceId(attendance.getId().toString())
            .studentCode(attendance.getStudent().getStudentCode())
            .studentName(attendance.getStudent().getUser().getFullName())
            .sessionId(session.getId().toString())
            .className(session.getSchoolClass().getClassCode())
            .subjectCode(session.getSubject().getCode())
            .subjectName(session.getSubject().getName())
            .teacherCode(teacherCode)
            .teacherName(teacherName)
            .sessionStartTime(session.getStartTime())
            .sessionEndTime(session.getEndTime())
            .status(attendance.getStatus())
            .method(attendance.getMethod())
            .capturedByCode(capturedByCode)
            .capturedByName(capturedByName)
            .createdAt(attendance.getCreatedAt())
            .build();
    }
}
