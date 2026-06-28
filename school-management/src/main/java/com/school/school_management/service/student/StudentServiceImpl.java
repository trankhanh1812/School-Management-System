package com.school.school_management.service.student;

import com.school.school_management.dto.student.StudentResponse;
import com.school.school_management.dto.student.StudentTranscriptResponse;
import com.school.school_management.dto.student.StudentUpsertRequest;
import com.school.school_management.dto.student.PromotionHistoryResponse;
import com.school.school_management.dto.student.ScoreHistoryResponse;
import com.school.school_management.entity.AcademicYear;
import com.school.school_management.entity.AcademicRankRule;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.Role;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Score;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.User;
import com.school.school_management.entity.UserRole;
import com.school.school_management.entity.PromotionLog;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.AcademicYearRepository;
import com.school.school_management.repository.AcademicRankRuleRepository;
import com.school.school_management.repository.RoleRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.PromotionLogRepository;
import com.school.school_management.repository.ScoreHistoryRepository;
import com.school.school_management.repository.UserRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class StudentServiceImpl implements StudentService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AcademicRankRuleRepository academicRankRuleRepository;
    private final StudentClassRepository studentClassRepository;
    private final PasswordEncoder passwordEncoder;
    private final PromotionLogRepository promotionLogRepository;
    private final ScoreHistoryRepository scoreHistoryRepository;

    public StudentServiceImpl(
            StudentRepository studentRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            SchoolClassRepository schoolClassRepository,
            AcademicYearRepository academicYearRepository,
            AcademicRankRuleRepository academicRankRuleRepository,
            StudentClassRepository studentClassRepository,
            PasswordEncoder passwordEncoder,
            PromotionLogRepository promotionLogRepository,
            ScoreHistoryRepository scoreHistoryRepository) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.academicYearRepository = academicYearRepository;
        this.academicRankRuleRepository = academicRankRuleRepository;
        this.studentClassRepository = studentClassRepository;
        this.passwordEncoder = passwordEncoder;
        this.promotionLogRepository = promotionLogRepository;
        this.scoreHistoryRepository = scoreHistoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getStudents(String academicYearCode, String classQuery, String status, String search, Integer limit, String scope) {
        String normalizedScope = isBlank(scope) ? "current" : scope.trim().toLowerCase(Locale.ROOT);
        String resolvedAcademicYear = normalizeOptionalCode(academicYearCode);

        if (isBlank(resolvedAcademicYear) && !"all".equals(normalizedScope)) {
            resolvedAcademicYear = findCurrentAcademicYearCode();
        }

        String resolvedClassQuery = normalizeOptionalCode(classQuery);
        String resolvedStatus = normalizeOptionalCode(status);
        String resolvedSearchPattern = normalizeSearchPattern(search);
        int pageSize = normalizeLimit(limit, 120, 500);

        return studentRepository.searchStudents(
                isBlank(resolvedAcademicYear) ? null : resolvedAcademicYear,
                isBlank(resolvedClassQuery) ? null : resolvedClassQuery,
                isBlank(resolvedStatus) ? null : resolvedStatus,
                isBlank(resolvedSearchPattern) ? null : resolvedSearchPattern,
                PageRequest.of(0, pageSize)
            )
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentByCode(String studentCode) {
        Student student = getStudentEntity(studentCode);
        assertCurrentUserCanAccess(student);
        return toResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse.SubjectResultItem> getStudentScores(String studentCode) {
        Student student = getStudentEntity(studentCode);
        assertCurrentUserCanAccess(student);
        return buildSubjectResults(student);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentTranscriptResponse getStudentTranscript(String studentCode) {
        Student student = getStudentEntity(studentCode);
        assertCurrentUserCanAccess(student);
        List<StudentResponse.SubjectResultItem> subjectResults = buildSubjectResults(student);
        return StudentTranscriptResponse.builder()
            .transcript(buildTranscript(subjectResults))
            .transcriptOverview(buildTranscriptOverview(student, subjectResults))
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getMyProfile() {
        Student currentStudent = getCurrentStudentProfile();
        return toResponse(currentStudent);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse.SubjectResultItem> getMyScores() {
        Student currentStudent = getCurrentStudentProfile();
        return buildSubjectResults(currentStudent);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentTranscriptResponse getMyTranscript() {
        Student currentStudent = getCurrentStudentProfile();
        List<StudentResponse.SubjectResultItem> subjectResults = buildSubjectResults(currentStudent);
        return StudentTranscriptResponse.builder()
            .transcript(buildTranscript(subjectResults))
            .transcriptOverview(buildTranscriptOverview(currentStudent, subjectResults))
            .build();
    }

    @Override
    public StudentResponse createStudent(StudentUpsertRequest request) {
        String studentCode = normalizeCode(request.getStudentCode());
        if (studentRepository.existsByStudentCodeAndDeletedAtIsNull(studentCode)) {
            throw new CustomException("Student code already exists", 409);
        }

        String email = normalizeEmail(request.getEmail(), studentCode);
        ensureEmailAvailable(email, null);

        // Username: nationalId (CCCD) if provided, else studentCode
        String nationalId = normalizeOptionalText(request.getNationalId());
        String username = !isBlank(nationalId) ? nationalId : studentCode.toLowerCase(Locale.ROOT);
        // If nationalId provided → auto-created account, force password change on first login
        boolean forcePasswordChange = !isBlank(nationalId);
        // Initial password = nationalId if provided, else studentCode
        String initialPassword = !isBlank(nationalId) ? nationalId : studentCode;

        User user = User.builder()
            .username(username)
            .email(email)
            .passwordHash(passwordEncoder.encode(initialPassword))
            .fullName(normalizeText(request.getFullName()))
            .status(ACTIVE_STATUS)
            .forcePasswordChange(forcePasswordChange)
            .build();

        Role role = getOrCreateStudentRole();
        user.getUserRoles().add(
            UserRole.builder()
                .user(user)
                .role(role)
                .build()
        );

        User savedUser = userRepository.save(user);
        NameParts nameParts = splitFullName(request.getFullName());
        Student student = Student.builder()
            .user(savedUser)
            .studentCode(studentCode)
            .nationalId(nationalId)
            .firstName(nameParts.firstName())
            .lastName(nameParts.lastName())
            .dateOfBirth(parseDate(request.getDateOfBirth()))
            .gender(normalizeOptionalText(request.getGender()))
            .phone(normalizeOptionalText(request.getPhone()))
            .address(normalizeOptionalText(request.getAddress()))
            .enrollmentDate(LocalDate.now())
            .status(defaultStatus(request.getStatus()))
            .build();

        Student savedStudent = studentRepository.save(student);
        upsertCurrentClass(savedStudent, request);
        return toResponse(savedStudent);
    }

    @Override
    public StudentResponse updateStudent(String studentCode, StudentUpsertRequest request) {
        Student student = getStudentEntity(studentCode);
        String nextStudentCode = normalizeCode(request.getStudentCode());

        if (!student.getStudentCode().equalsIgnoreCase(nextStudentCode)
                && studentRepository.existsByStudentCodeAndDeletedAtIsNull(nextStudentCode)) {
            throw new CustomException("Student code already exists", 409);
        }

        String email = normalizeEmail(request.getEmail(), nextStudentCode);
        ensureEmailAvailable(email, student.getUser().getId());

        String nationalId = normalizeOptionalText(request.getNationalId());
        String username = !isBlank(nationalId) ? nationalId : nextStudentCode.toLowerCase(Locale.ROOT);

        NameParts nameParts = splitFullName(request.getFullName());
        student.setStudentCode(nextStudentCode);
        student.setNationalId(nationalId);
        student.setFirstName(nameParts.firstName());
        student.setLastName(nameParts.lastName());
        student.setDateOfBirth(parseDate(request.getDateOfBirth()));
        student.setGender(normalizeOptionalText(request.getGender()));
        student.setPhone(normalizeOptionalText(request.getPhone()));
        student.setAddress(normalizeOptionalText(request.getAddress()));
        student.setStatus(defaultStatus(request.getStatus()));

        User user = student.getUser();
        user.setEmail(email);
        user.setUsername(username);
        user.setFullName(normalizeText(request.getFullName()));
        user.setStatus(ACTIVE_STATUS);
        // If nationalId newly provided and account hasn't changed password yet, keep forcePasswordChange
        if (!isBlank(nationalId) && !user.isForcePasswordChange()) {
            // Only set forcePasswordChange if username is being changed to nationalId for the first time
            // (i.e., previous username was studentCode-based)
            String prevUsername = user.getUsername();
            if (prevUsername == null || prevUsername.equalsIgnoreCase(nextStudentCode)) {
                user.setForcePasswordChange(true);
            }
        }

        Student savedStudent = studentRepository.save(student);
        upsertCurrentClass(savedStudent, request);
        return toResponse(savedStudent);
    }

    private Student getStudentEntity(String studentCode) {
        return studentRepository.findByStudentCodeAndDeletedAtIsNull(normalizeCode(studentCode))
            .orElseThrow(() -> new CustomException("Student not found", 404));
    }

    private StudentResponse toResponse(Student student) {
        List<StudentResponse.SubjectResultItem> subjectResults = buildSubjectResults(student);
        List<StudentResponse.TranscriptItem> transcript = buildTranscript(subjectResults);
        List<StudentResponse.TranscriptOverviewItem> transcriptOverview = buildTranscriptOverview(student, subjectResults);
        String scoreAverage = calculateOverallAverage(subjectResults);

        StudentClass currentClass = studentClassRepository.findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student)
            .orElseGet(() -> student.getStudentClasses().stream()
                .max(Comparator.comparing(StudentClass::getStartDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null));

        List<StudentResponse.ParentSummary> parents = student.getParentStudents().stream()
            .map(ParentStudent::getParent)
            .filter(parent -> parent != null)
            .map(parent -> StudentResponse.ParentSummary.builder()
                .role(Boolean.TRUE.equals(findPrimaryContact(student, parent.getParentCode())) ? "Lien he chinh" : "Phu huynh")
                .fullName(nullSafe(parent.getFullName(), "Chua cap nhat"))
                .phone(nullSafe(parent.getPhone(), "Chua cap nhat"))
                .email(parent.getUser() != null ? nullSafe(parent.getUser().getEmail(), "Chua cap nhat") : "Chua cap nhat")
                .accountStatus(parent.getUser() != null ? nullSafe(parent.getUser().getStatus(), ACTIVE_STATUS) : ACTIVE_STATUS)
                .build())
            .toList();

        List<StudentResponse.AcademicHistoryItem> academicHistory = studentClassRepository.findByStudentOrderByStartDateDesc(student)
            .stream()
            .map(item -> StudentResponse.AcademicHistoryItem.builder()
                .academicYear(item.getAcademicYear() != null ? nullSafe(item.getAcademicYear().getCode(), "Chua cap nhat") : "Chua cap nhat")
                .className(item.getSchoolClass() != null ? nullSafe(item.getSchoolClass().getClassName(), "Chua cap nhat") : "Chua cap nhat")
                .result(mapHistoryResult(item.getStatus()))
                .note(nullSafe(item.getTransferReason(), "Cap nhat tu lich su lop hoc"))
                .build())
            .toList();

        String fullName = buildFullName(student);

        return StudentResponse.builder()
            .studentCode(student.getStudentCode())
            .fullName(fullName)
            .className(currentClass != null && currentClass.getSchoolClass() != null
                ? nullSafe(currentClass.getSchoolClass().getClassName(), "Chua phan lop")
                : "Chua phan lop")
            .academicYear(currentClass != null && currentClass.getAcademicYear() != null
                ? nullSafe(currentClass.getAcademicYear().getCode(), "2026-2027")
                : "2026-2027")
            .conduct(resolveConduct(student))
            .scoreAverage(scoreAverage)
            .status(nullSafe(student.getStatus(), ACTIVE_STATUS))
            .homeroomTeacher(resolveHomeroomTeacher(currentClass))
            .dateOfBirth(student.getDateOfBirth() != null ? student.getDateOfBirth().format(DISPLAY_DATE) : "Chua cap nhat")
            .gender(nullSafe(student.getGender(), "Chua cap nhat"))
            .phone(nullSafe(student.getPhone(), "Chua cap nhat"))
            .email(student.getUser() != null ? nullSafe(student.getUser().getEmail(), "Chua cap nhat") : "Chua cap nhat")
            .address(nullSafe(student.getAddress(), "Chua cap nhat"))
            .avatarLabel(buildAvatarLabel(fullName))
            .parents(parents)
            .academicHistory(academicHistory)
                .transcript(transcript)
                .transcriptOverview(transcriptOverview)
                .subjectResults(subjectResults)
                .alerts(buildAlerts(student, scoreAverage))
            .build();
    }

        private List<StudentResponse.SubjectResultItem> buildSubjectResults(Student student) {
            Map<String, List<Score>> grouped = new LinkedHashMap<>();

            student.getScores().stream()
                .filter(score -> score != null && score.getDeletedAt() == null)
                .forEach(score -> {
                    String academicYear = resolveAcademicYear(score);
                    String semester = resolveSemester(score);
                    String subject = resolveSubject(score);
                    String key = academicYear + "|" + semester + "|" + subject;
                    grouped.computeIfAbsent(key, ignored -> new ArrayList<>()).add(score);
                });

            return grouped.entrySet().stream()
                .map(entry -> buildSubjectResultItem(entry.getValue()))
                .sorted(
                    Comparator.comparing(StudentResponse.SubjectResultItem::getAcademicYear, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(StudentResponse.SubjectResultItem::getSemester, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(StudentResponse.SubjectResultItem::getSubject, Comparator.nullsLast(Comparator.naturalOrder()))
                )
                .toList();
        }

        private StudentResponse.SubjectResultItem buildSubjectResultItem(List<Score> scores) {
            if (scores == null || scores.isEmpty()) {
                return StudentResponse.SubjectResultItem.builder()
                    .academicYear("2026-2027")
                    .subject("Chua cap nhat")
                    .teacher("Chua cap nhat")
                    .semester("Hoc ky I")
                    .officialAverage("0.0")
                    .surveyAverage("0.0")
                    .rank("Chua xep loai")
                    .assessments(List.of())
                    .build();
            }

            Score representative = scores.get(0);
            List<StudentResponse.AssessmentItem> assessments = scores.stream()
                .sorted(Comparator.comparing(Score::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toAssessmentItem)
                .toList();

            double average = scores.stream()
                .map(Score::getScoreValue)
                .filter(value -> value != null)
                .mapToDouble(value -> value.doubleValue())
                .average()
                .orElse(0.0);

            String averageDisplay = formatDecimal(average);
            return StudentResponse.SubjectResultItem.builder()
                .academicYear(resolveAcademicYear(representative))
                .subject(resolveSubject(representative))
                .teacher(resolveTeacher(representative))
                .semester(resolveSemester(representative))
                .officialAverage(averageDisplay)
                .surveyAverage(averageDisplay)
                .rank(mapAcademicRank(average))
                .assessments(assessments)
                .build();
        }

        private StudentResponse.AssessmentItem toAssessmentItem(Score score) {
            String scoreValue = score.getScoreValue() != null ? formatDecimal(score.getScoreValue().doubleValue()) : "0.0";
            return StudentResponse.AssessmentItem.builder()
                .assessmentName(resolveAssessmentName(score))
                .category(resolveAssessmentCategory(score))
                .weight(resolveWeight(score))
                .score(scoreValue)
                .recordedBy(resolveTeacher(score))
                .recordedAt(formatDateTime(score.getUpdatedAt()))
                .status(nullSafe(score.getStatus(), "DRAFT"))
                .build();
        }

        private List<StudentResponse.TranscriptItem> buildTranscript(List<StudentResponse.SubjectResultItem> subjectResults) {
            Map<String, TranscriptAccumulator> grouped = new LinkedHashMap<>();
            for (StudentResponse.SubjectResultItem item : subjectResults) {
                String key = item.getAcademicYear() + "|" + item.getSubject();
                grouped.computeIfAbsent(
                    key,
                    ignored -> new TranscriptAccumulator(item.getSubject())
                ).consume(item.getSemester(), parseNumber(item.getOfficialAverage()));
            }

            return grouped.values().stream()
                .map(TranscriptAccumulator::toTranscriptItem)
                .sorted(
                    Comparator.comparing(StudentResponse.TranscriptItem::getSubject, Comparator.nullsLast(Comparator.naturalOrder()))
                )
                .toList();
        }

        private List<StudentResponse.TranscriptOverviewItem> buildTranscriptOverview(
                Student student,
                List<StudentResponse.SubjectResultItem> subjectResults) {
            Map<String, List<Double>> byYear = new LinkedHashMap<>();
            for (StudentResponse.SubjectResultItem item : subjectResults) {
                byYear.computeIfAbsent(item.getAcademicYear(), ignored -> new ArrayList<>())
                    .add(parseNumber(item.getOfficialAverage()));
            }

            return byYear.entrySet().stream()
                .map(entry -> {
                    double yearAverage = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                    return StudentResponse.TranscriptOverviewItem.builder()
                        .academicYear(entry.getKey())
                        .className(resolveCurrentClassName(student))
                        .semesterAverage(formatDecimal(yearAverage))
                        .yearAverage(formatDecimal(yearAverage))
                        .academicRank(mapAcademicRank(yearAverage))
                        .conduct(resolveConduct(student))
                        .absences(countAbsences(student) + " ngay")
                        .build();
                })
                .sorted(
                    Comparator.comparing(StudentResponse.TranscriptOverviewItem::getAcademicYear, Comparator.nullsLast(Comparator.reverseOrder()))
                )
                .toList();
        }

        private String calculateOverallAverage(List<StudentResponse.SubjectResultItem> subjectResults) {
            double average = subjectResults.stream()
                .map(StudentResponse.SubjectResultItem::getOfficialAverage)
                .mapToDouble(this::parseNumber)
                .average()
                .orElse(0.0);
            return formatDecimal(average);
        }

        private List<String> buildAlerts(Student student, String scoreAverage) {
            List<String> alerts = new ArrayList<>();
            double average = parseNumber(scoreAverage);

            if (average > 0 && average < 5.0) {
                alerts.add("Canh bao hoc luc: diem trung binh duoi 5.0");
            }

            long absences = countAbsences(student);
            if (absences >= 5) {
                alerts.add("Canh bao chuyen can: vang " + absences + " buoi");
            }

            return alerts;
        }

        private long countAbsences(Student student) {
            return student.getAttendances().stream()
                .filter(attendance -> attendance != null)
                .filter(attendance -> attendance.getStatus() != null)
                .filter(attendance -> "ABSENT".equalsIgnoreCase(attendance.getStatus().trim()))
                .count();
        }

        private String resolveAcademicYear(Score score) {
            if (score.getExam() != null
                    && score.getExam().getSemester() != null
                    && score.getExam().getSemester().getAcademicYear() != null) {
                return nullSafe(score.getExam().getSemester().getAcademicYear().getCode(), "2026-2027");
            }
            return "2026-2027";
        }

        private String resolveSemester(Score score) {
            if (score.getExam() != null && score.getExam().getSemester() != null) {
                return normalizeSemesterCode(score.getExam().getSemester().getCode());
            }
            return "Hoc ky I";
        }

        private String resolveSubject(Score score) {
            if (score.getExam() != null && score.getExam().getSubject() != null) {
                return nullSafe(score.getExam().getSubject().getName(), "Chua cap nhat");
            }
            return "Chua cap nhat";
        }

        private String resolveTeacher(Score score) {
            if (score.getTeacher() != null && score.getTeacher().getUser() != null && !isBlank(score.getTeacher().getUser().getFullName())) {
                return score.getTeacher().getUser().getFullName();
            }
            if (score.getTeacher() != null) {
                String firstName = nullSafe(score.getTeacher().getFirstName(), "");
                String lastName = nullSafe(score.getTeacher().getLastName(), "");
                String fullName = (lastName + " " + firstName).trim();
                return isBlank(fullName) ? "Chua cap nhat" : fullName;
            }
            return "Chua cap nhat";
        }

        private String resolveAssessmentName(Score score) {
            if (score.getExam() != null && !isBlank(score.getExam().getTitle())) {
                return score.getExam().getTitle();
            }
            if (score.getExam() != null && !isBlank(score.getExam().getExamType())) {
                return score.getExam().getExamType();
            }
            return "Dau diem";
        }

        private String resolveAssessmentCategory(Score score) {
            if (score.getExam() != null && !isBlank(score.getExam().getExamType())) {
                return score.getExam().getExamType();
            }
            return "CHINH_THUC";
        }

        private String resolveWeight(Score score) {
            if (score.getExam() != null && score.getExam().getWeight() != null) {
                return formatDecimal(score.getExam().getWeight().doubleValue());
            }
            return "1.0";
        }

        private String normalizeSemesterCode(String rawCode) {
            if (isBlank(rawCode)) {
                return "Hoc ky I";
            }
            String code = rawCode.trim().toUpperCase(Locale.ROOT);
            if (code.contains("2") || code.contains("II")) {
                return "Hoc ky II";
            }
            return "Hoc ky I";
        }

        private String resolveCurrentClassName(Student student) {
            return studentClassRepository.findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student)
                .map(studentClass -> studentClass.getSchoolClass() != null
                    ? nullSafe(studentClass.getSchoolClass().getClassName(), "Chua phan lop")
                    : "Chua phan lop")
                .orElse("Chua phan lop");
        }

        private String resolveConduct(Student student) {
            return student.getConducts().stream()
                .map(conduct -> conduct != null ? conduct.getConductLevel() : null)
                .filter(level -> !isBlank(level))
                .findFirst()
                .map(String::trim)
                .orElse("Chua cap nhat");
        }

        private String mapAcademicRank(double score) {
            List<AcademicRankRule> rules = academicRankRuleRepository.findAllByOrderByCodeAsc();
            if (rules.isEmpty()) {
                return defaultAcademicRank(score);
            }

            return rules.stream()
                .filter(rule -> rule.getMinAverage() != null)
                .sorted(Comparator.comparing(AcademicRankRule::getMinAverage).reversed())
                .filter(rule -> score >= rule.getMinAverage().doubleValue())
                .map(this::resolveAcademicRankLabel)
                .findFirst()
                .orElseGet(() -> defaultAcademicRank(score));
        }

        private String defaultAcademicRank(double score) {
            if (score >= 8.0) {
                return "Giỏi";
            }
            if (score >= 6.5) {
                return "Khá";
            }
            if (score >= 5.0) {
                return "Trung bình";
            }
            return "Cần hỗ trợ";
        }

        private String resolveAcademicRankLabel(AcademicRankRule rule) {
            String code = nullSafe(rule.getCode(), "").toUpperCase(Locale.ROOT);
            String name = nullSafe(rule.getName(), "");
            String normalizedName = name.toLowerCase(Locale.ROOT);

            if (code.contains("GIOI") || normalizedName.contains("giỏi")) {
                return "Giỏi";
            }
            if (code.contains("KHA") || normalizedName.contains("khá")) {
                return "Khá";
            }
            if (code.contains("TRUNG") || normalizedName.contains("trung bình")) {
                return "Trung bình";
            }
            if (code.contains("YEU") || normalizedName.contains("yếu")) {
                return "Yếu";
            }
            return name.isBlank() ? defaultAcademicRank(rule.getMinAverage() != null ? rule.getMinAverage().doubleValue() : 0.0) : name;
        }

        private String formatDecimal(double value) {
            return String.format(Locale.US, "%.1f", value);
        }

        private double parseNumber(String value) {
            if (isBlank(value)) {
                return 0.0;
            }
            try {
                return Double.parseDouble(value.trim());
            } catch (NumberFormatException exception) {
                return 0.0;
            }
        }

        private String formatDateTime(OffsetDateTime value) {
            if (value == null) {
                return "Chua cap nhat";
            }
            return value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        }

        private Student getCurrentStudentProfile() {
            User currentUser = getCurrentUser();
            if (currentUser.getStudent() != null) {
                return currentUser.getStudent();
            }

            throw new CustomException("Current account is not linked to a student profile", 403);
        }

        private void assertCurrentUserCanAccess(Student targetStudent) {
            User currentUser = getCurrentUser();
            List<String> roleCodes = currentUser.getUserRoles().stream()
                .map(UserRole::getRole)
                .filter(role -> role != null)
                .map(Role::getCode)
                .filter(code -> !isBlank(code))
                .map(code -> code.toUpperCase(Locale.ROOT))
                .toList();

            if (roleCodes.contains("ADMIN") || roleCodes.contains("TEACHER")) {
                return;
            }

            if (roleCodes.contains("STUDENT")) {
                if (currentUser.getStudent() != null && currentUser.getStudent().getId().equals(targetStudent.getId())) {
                    return;
                }
                throw new CustomException("Forbidden", 403);
            }

            if (roleCodes.contains("PARENT")) {
                if (currentUser.getParent() != null) {
                    boolean isLinked = currentUser.getParent().getParentStudents().stream()
                        .anyMatch(link -> link != null && link.getStudent() != null && link.getStudent().getId().equals(targetStudent.getId()));
                    if (isLinked) {
                        return;
                    }
                }
                throw new CustomException("Forbidden", 403);
            }

            throw new CustomException("Forbidden", 403);
        }

        private User getCurrentUser() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || isBlank(authentication.getName())) {
                throw new CustomException("Unauthenticated", 401);
            }

            String email = authentication.getName().trim().toLowerCase(Locale.ROOT);
            return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Current user not found", 404));
        }

        private static final class TranscriptAccumulator {
            private final String subject;
            private Double semester1;
            private Double semester2;

            private TranscriptAccumulator(String subject) {
                this.subject = subject;
            }

            private void consume(String semester, double value) {
                if ("Hoc ky II".equalsIgnoreCase(semester)) {
                    semester2 = value;
                } else {
                    semester1 = value;
                }
            }

            private StudentResponse.TranscriptItem toTranscriptItem() {
                double yearAverage;
                if (semester1 != null && semester2 != null) {
                    yearAverage = (semester1 + semester2) / 2.0;
                } else if (semester1 != null) {
                    yearAverage = semester1;
                } else if (semester2 != null) {
                    yearAverage = semester2;
                } else {
                    yearAverage = 0.0;
                }

                return StudentResponse.TranscriptItem.builder()
                    .subject(subject)
                    .semester1(semester1 == null ? "-" : String.format(Locale.US, "%.1f", semester1))
                    .semester2(semester2 == null ? "-" : String.format(Locale.US, "%.1f", semester2))
                    .yearAverage(String.format(Locale.US, "%.1f", yearAverage))
                    .build();
            }
        }

    private void upsertCurrentClass(Student student, StudentUpsertRequest request) {
        if (isBlank(request.getAcademicYear()) || isBlank(request.getClassName())) {
            return;
        }

        AcademicYear academicYear = academicYearRepository.findByCode(request.getAcademicYear().trim())
            .orElse(null);
        SchoolClass schoolClass = schoolClassRepository
            .findByClassNameAndAcademicYear_CodeAndDeletedAtIsNull(request.getClassName().trim(), request.getAcademicYear().trim())
            .orElse(null);

        if (academicYear == null || schoolClass == null) {
            log.info("Skip student_class mapping for {} because class/year is missing", student.getStudentCode());
            return;
        }

        StudentClass currentClass = studentClassRepository.findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student)
            .orElse(
                StudentClass.builder()
                    .student(student)
                    .build()
            );

        currentClass.setAcademicYear(academicYear);
        currentClass.setSchoolClass(schoolClass);
        currentClass.setStatus(defaultStatus(request.getStatus()));
        if (currentClass.getStartDate() == null) {
            currentClass.setStartDate(LocalDate.now());
        }

        studentClassRepository.save(currentClass);
    }

    private void ensureEmailAvailable(String email, UUID currentUserId) {
        userRepository.findByEmail(email).ifPresent(existingUser -> {
            if (currentUserId == null || !existingUser.getId().equals(currentUserId)) {
                throw new CustomException("Email already exists", 409);
            }
        });
    }

    private Role getOrCreateStudentRole() {
        return roleRepository.findByCode("STUDENT").orElseGet(() ->
            roleRepository.save(
                Role.builder()
                    .code("STUDENT")
                    .name("Hoc sinh")
                    .description("Default student role")
                    .build()
            )
        );
    }

    private String normalizeCode(String value) {
        if (isBlank(value)) {
            throw new CustomException("Student code is required", 400);
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String value, String studentCode) {
        if (isBlank(value)) {
            return studentCode.toLowerCase(Locale.ROOT) + "@sms.local";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String buildUsername(String studentCode, String email) {
        if (!isBlank(studentCode)) {
            return studentCode.toLowerCase(Locale.ROOT);
        }
        int atIndex = email.indexOf("@");
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private String normalizeText(String value) {
        if (isBlank(value)) {
            throw new CustomException("Full name is required", 400);
        }
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private String normalizeOptionalCode(String value) {
        return isBlank(value) ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeSearchPattern(String value) {
        if (isBlank(value)) {
            return null;
        }
        return "%" + value.trim().toUpperCase(Locale.ROOT) + "%";
    }

    private int normalizeLimit(Integer requestedLimit, int defaultLimit, int maxLimit) {
        if (requestedLimit == null || requestedLimit <= 0) {
            return defaultLimit;
        }
        return Math.min(requestedLimit, maxLimit);
    }

    private String findCurrentAcademicYearCode() {
        return academicYearRepository.findByStatusSafeOrderByStartDateDesc("CURRENT", PageRequest.of(0, 1)).stream().findFirst()
            .or(() -> academicYearRepository.findByStatusSafeOrderByStartDateDesc("ACTIVE", PageRequest.of(0, 1)).stream().findFirst())
            .or(() -> academicYearRepository.findFirstByOrderByStartDateDesc())
            .map(AcademicYear::getCode)
            .map(String::trim)
            .orElse(null);
    }

    private String defaultStatus(String value) {
        return isBlank(value) ? ACTIVE_STATUS : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private LocalDate parseDate(String value) {
        if (isBlank(value)) {
            return null;
        }

        List<DateTimeFormatter> formatters = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DISPLAY_DATE
        );

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(value.trim(), formatter);
            } catch (DateTimeParseException ignored) {
                // Try next format.
            }
        }

        throw new CustomException("Date of birth is invalid", 400);
    }

    private NameParts splitFullName(String fullName) {
        String normalized = normalizeText(fullName);
        String[] parts = normalized.split("\\s+");
        if (parts.length == 1) {
            return new NameParts(parts[0], "");
        }

        String firstName = parts[parts.length - 1];
        String lastName = normalized.substring(0, normalized.length() - firstName.length()).trim();
        return new NameParts(firstName, lastName);
    }

    @Override
    public void deleteStudent(String studentCode) {
        Student student = getStudentEntity(studentCode);
        student.setDeletedAt(java.time.OffsetDateTime.now());
        student.setDeletedBy(getCurrentUserId());
        studentRepository.save(student);
    }

    private UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }

    private String buildFullName(Student student) {
        if (student.getUser() != null && !isBlank(student.getUser().getFullName())) {
            return student.getUser().getFullName().trim();
        }
        return (nullSafe(student.getLastName(), "") + " " + nullSafe(student.getFirstName(), "")).trim();
    }

    private String resolveHomeroomTeacher(StudentClass studentClass) {
        if (studentClass == null || studentClass.getSchoolClass() == null || studentClass.getSchoolClass().getHomeroomTeacher() == null) {
            return "Chua cap nhat";
        }

        if (studentClass.getSchoolClass().getHomeroomTeacher().getUser() != null
                && !isBlank(studentClass.getSchoolClass().getHomeroomTeacher().getUser().getFullName())) {
            return studentClass.getSchoolClass().getHomeroomTeacher().getUser().getFullName();
        }

        return (nullSafe(studentClass.getSchoolClass().getHomeroomTeacher().getLastName(), "") + " "
            + nullSafe(studentClass.getSchoolClass().getHomeroomTeacher().getFirstName(), "")).trim();
    }

    private String nullSafe(String value, String fallback) {
        return isBlank(value) ? fallback : value;
    }

    private String mapHistoryResult(String status) {
        if (isBlank(status)) {
            return "Dang hoc";
        }
        return status;
    }

    private boolean findPrimaryContact(Student student, String parentCode) {
        return student.getParentStudents().stream()
            .filter(item -> item.getParent() != null && parentCode.equals(item.getParent().getParentCode()))
            .findFirst()
            .map(item -> Boolean.TRUE.equals(item.getIsPrimaryContact()))
            .orElse(false);
    }

    private String buildAvatarLabel(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 0) {
            return "HS";
        }
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase(Locale.ROOT);
        }
        String first = parts[0].substring(0, 1);
        String second = parts[parts.length - 1].substring(0, 1);
        return (first + second).toUpperCase(Locale.ROOT);
    }

    private record NameParts(String firstName, String lastName) {
    }
    
    @Override
    @Transactional(readOnly = true)
    public PromotionHistoryResponse getPromotionHistory(String studentCode) {
        Student student = getStudentEntity(studentCode);
        assertCurrentUserCanAccess(student);
        
        UUID studentId = student.getId();
        List<PromotionLog> promotions = promotionLogRepository.findAllByStudent_IdOrderByPromotedAtDesc(studentId);
        
        List<PromotionHistoryResponse.PromotionRecord> records = promotions.stream()
            .map(promotion -> PromotionHistoryResponse.PromotionRecord.builder()
                .fromClassName(promotion.getFromClass() != null ? promotion.getFromClass().getClassName() : "N/A")
                .fromAcademicYear(promotion.getFromAcademicYear() != null ? promotion.getFromAcademicYear().getCode() : "N/A")
                .toClassName(promotion.getToClass() != null ? promotion.getToClass().getClassName() : "N/A")
                .toAcademicYear(promotion.getToAcademicYear() != null ? promotion.getToAcademicYear().getCode() : "N/A")
                .promotionResult(nullSafe(promotion.getPromotionResult(), "UNKNOWN"))
                .promotedAt(promotion.getPromotedAt())
                .promotedByName(resolvePromotedByName(promotion.getPromotedBy()))
                .build())
            .toList();
        
        return PromotionHistoryResponse.builder()
            .studentCode(student.getStudentCode())
            .fullName(buildFullName(student))
            .records(records)
            .build();
    }
    
    private String resolvePromotedByName(UUID promotedById) {
        if (promotedById == null) {
            return "System";
        }
        return userRepository.findById(promotedById)
            .map(user -> nullSafe(user.getFullName(), "Unknown"))
            .orElse("Unknown");
    }

    @Override
    @Transactional(readOnly = true)
    public ScoreHistoryResponse getScoreHistory(String studentCode) {
        Student student = getStudentEntity(studentCode);
        assertCurrentUserCanAccess(student);
        
        UUID studentId = student.getId();
        List<com.school.school_management.entity.ScoreHistory> scoreHistories = scoreHistoryRepository.findAllByStudent_IdOrderByChangedAtDesc(studentId);
        
        List<ScoreHistoryResponse.ScoreRecord> records = scoreHistories.stream()
            .<ScoreHistoryResponse.ScoreRecord>map(history -> ScoreHistoryResponse.ScoreRecord.builder()
                .examTitle(history.getScore() != null && history.getScore().getExam() != null ? history.getScore().getExam().getTitle() : "N/A")
                .subjectName(history.getScore() != null && history.getScore().getExam() != null && history.getScore().getExam().getSubject() != null ? history.getScore().getExam().getSubject().getName() : "N/A")
                .examType(history.getScore() != null && history.getScore().getExam() != null ? nullSafe(history.getScore().getExam().getExamType(), "N/A") : "N/A")
                .oldValue(history.getOldValue())
                .newValue(history.getNewValue())
                .changeReason(nullSafe(history.getChangeReason(), "No reason provided"))
                .changedAt(history.getChangedAt())
                .changedByName(resolveChangedByName(history.getChangedBy()))
                .build())
            .toList();
        
        return ScoreHistoryResponse.builder()
            .studentCode(student.getStudentCode())
            .fullName(buildFullName(student))
            .records(records)
            .build();
    }
    
    private String resolveChangedByName(User changedByUser) {
        if (changedByUser == null) {
            return "System";
        }
        return nullSafe(changedByUser.getFullName(), "Unknown");
    }
}
