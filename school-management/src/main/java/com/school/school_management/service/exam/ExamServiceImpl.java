package com.school.school_management.service.exam;

import com.school.school_management.dto.exam.ExamResponse;
import com.school.school_management.dto.exam.ExamUpsertRequest;
import com.school.school_management.dto.system.SystemSettingResponse;
import com.school.school_management.entity.Exam;
import com.school.school_management.entity.ExamClass;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Score;
import com.school.school_management.entity.Semester;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.Subject;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.TeachingAssignment;
import com.school.school_management.entity.User;
import com.school.school_management.enums.ExamType;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.ExamClassRepository;
import com.school.school_management.repository.ExamRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.ScoreRepository;
import com.school.school_management.repository.SemesterRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.SubjectRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.notification.NotificationAutomationService;
import com.school.school_management.service.system.SystemSettingService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExamServiceImpl implements ExamService {

    private static final String DRAFT = "DRAFT";

    private final ExamRepository examRepository;
    private final ExamClassRepository examClassRepository;
    private final ScoreRepository scoreRepository;
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final StudentClassRepository studentClassRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final SystemSettingService systemSettingService;
    private final NotificationAutomationService notificationAutomationService;

    public ExamServiceImpl(
            ExamRepository examRepository,
            ExamClassRepository examClassRepository,
            ScoreRepository scoreRepository,
            SemesterRepository semesterRepository,
            SubjectRepository subjectRepository,
            SchoolClassRepository schoolClassRepository,
            StudentClassRepository studentClassRepository,
            TeachingAssignmentRepository teachingAssignmentRepository,
            TeacherRepository teacherRepository,
            UserRepository userRepository,
            SystemSettingService systemSettingService,
            NotificationAutomationService notificationAutomationService) {
        this.examRepository = examRepository;
        this.examClassRepository = examClassRepository;
        this.scoreRepository = scoreRepository;
        this.semesterRepository = semesterRepository;
        this.subjectRepository = subjectRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.studentClassRepository = studentClassRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.systemSettingService = systemSettingService;
        this.notificationAutomationService = notificationAutomationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> listExams() {
        List<Exam> exams = examRepository.findAllByDeletedAtIsNullOrderByExamDateDesc();
        if (isCurrentUserAdmin()) {
            return exams.stream().map(this::toResponse).toList();
        }

        Teacher teacher = getCurrentTeacher();
        Set<String> allowedAssignmentKeys = teachingAssignmentRepository
            .findByTeacherOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(teacher)
            .stream()
            .map(this::toAssignmentKey)
            .collect(Collectors.toSet());

        return exams.stream()
            .filter(exam -> canTeacherAccessExam(exam, allowedAssignmentKeys))
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getMyExams() {
        User currentUser = getCurrentUser();
        Student student = currentUser.getStudent();
        if (student == null) {
            throw new CustomException("Current account is not linked to a student profile", 403);
        }

        Set<String> classCodes = studentClassRepository.findByStudentOrderByStartDateDesc(student).stream()
            .map(StudentClass::getSchoolClass)
            .filter(schoolClass -> schoolClass != null && schoolClass.getClassCode() != null)
            .map(SchoolClass::getClassCode)
            .collect(Collectors.toSet());

        return classCodes.stream()
            .flatMap(classCode -> examClassRepository.findBySchoolClass_ClassCode(classCode).stream())
            .map(ExamClass::getExam)
            .filter(exam -> exam != null && exam.getDeletedAt() == null)
            .collect(Collectors.toMap(Exam::getId, exam -> exam, (existing, duplicate) -> existing))
            .values().stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse getExam(String examId) {
        Exam exam = getExamEntity(examId);
        assertCanAccessExam(exam);
        return toResponse(exam);
    }

    @Override
    public ExamResponse createExam(ExamUpsertRequest request) {
        Semester semester = resolveSemester(request.getSemesterCode(), request.getAcademicYearCode());
        Subject subject = resolveSubject(request.getSubjectCode());
        validateExamDate(request.getExamDate());
        List<String> normalizedClassCodes = normalizeCodes(request.getClassCodes());

        assertCanCreateExam(semester, subject, normalizedClassCodes);

        ExamType examType = ExamType.fromString(request.getExamType());
        SystemSettingResponse setting = systemSettingService.getSettings();

        Exam exam = Exam.builder()
            .semester(semester)
            .subject(subject)
            .examType(examType.name())
            .title(request.getTitle().trim())
            .examDate(request.getExamDate() != null ? request.getExamDate() : LocalDate.now())
            .weight(resolveWeight(request.getWeight(), examType, setting))
            .editWindowDays(setting.getScoreEditWindowDays())
            .status(resolveStatus(request.getStatus()))
            .build();

        Exam savedExam = examRepository.save(exam);
        attachClassesAndBootstrapScores(savedExam, normalizedClassCodes, request.getAcademicYearCode());

        notificationAutomationService.notifyClassCodes(
            normalizedClassCodes,
            "Lịch kiểm tra mới",
            String.format(
                "Đã tạo bài kiểm tra %s (%s) cho các lớp liên quan vào ngày %s.",
                savedExam.getTitle(),
                savedExam.getExamType(),
                savedExam.getExamDate()
            ),
            "EVENT"
        );

        return toResponse(savedExam);
    }

    @Override
    public ExamResponse updateExam(String examId, ExamUpsertRequest request) {
        Exam exam = getExamEntity(examId);
        Semester semester = resolveSemester(request.getSemesterCode(), request.getAcademicYearCode());
        Subject subject = resolveSubject(request.getSubjectCode());
        validateExamDate(request.getExamDate());

        ExamType examType = ExamType.fromString(request.getExamType());
        SystemSettingResponse setting = systemSettingService.getSettings();

        exam.setSemester(semester);
        exam.setSubject(subject);
        exam.setExamType(examType.name());
        exam.setTitle(request.getTitle().trim());
        exam.setExamDate(request.getExamDate() != null ? request.getExamDate() : LocalDate.now());
        exam.setWeight(resolveWeight(request.getWeight(), examType, setting));
        exam.setEditWindowDays(setting.getScoreEditWindowDays());
        exam.setStatus(resolveStatus(request.getStatus()));

        List<String> normalizedClassCodes = normalizeCodes(request.getClassCodes());

        examClassRepository.deleteAll(examClassRepository.findByExam(exam));
        attachClassesAndBootstrapScores(exam, normalizedClassCodes, request.getAcademicYearCode());
        Exam saved = examRepository.save(exam);

        notificationAutomationService.notifyClassCodes(
            normalizedClassCodes,
            "Lịch kiểm tra đã thay đổi",
            String.format(
                "Bài kiểm tra %s đã được cập nhật. Vui lòng kiểm tra lại lịch thi.",
                saved.getTitle()
            ),
            "SCHEDULE_CHANGE"
        );

        return toResponse(saved);
    }

    @Override
    public void deleteExam(String examId) {
        Exam exam = getExamEntity(examId);
        List<String> classCodes = examClassRepository.findByExam(exam).stream()
            .map(item -> item.getSchoolClass() != null ? item.getSchoolClass().getClassCode() : null)
            .filter(item -> item != null && !item.isBlank())
            .distinct()
            .toList();

        exam.setDeletedAt(OffsetDateTime.now());
        exam.setDeletedBy(getCurrentUser().getId());
        examRepository.save(exam);

        notificationAutomationService.notifyClassCodes(
            classCodes,
            "Hủy bài kiểm tra",
            String.format("Bài kiểm tra %s đã bị hủy hoặc gỡ khỏi lịch.", exam.getTitle()),
            "ANNOUNCEMENT"
        );
    }

    private void attachClassesAndBootstrapScores(Exam exam, List<String> classCodes, String academicYearCode) {
        for (String classCode : classCodes) {
            SchoolClass schoolClass = schoolClassRepository
                .findByClassCodeAndAcademicYear_CodeAndDeletedAtIsNull(classCode, normalizeCode(academicYearCode))
                .orElseThrow(() -> new CustomException("Class not found in academic year: " + classCode, 404));

            examClassRepository.save(ExamClass.builder()
                .exam(exam)
                .schoolClass(schoolClass)
                .scheduledAt(exam.getExamDate().atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                .build());

            Teacher teacher = resolveTeachingTeacher(schoolClass.getClassCode(), exam.getSubject().getCode(), exam.getSemester().getCode(), exam.getSemester().getAcademicYear().getCode(), schoolClass);

            List<StudentClass> studentMappings = studentClassRepository.findBySchoolClassAndEndDateIsNull(schoolClass);
            for (StudentClass mapping : studentMappings) {
                if (mapping.getStudent() == null) {
                    continue;
                }

                boolean exists = scoreRepository.findByStudentAndExamAndDeletedAtIsNull(mapping.getStudent(), exam).isPresent();
                if (exists) {
                    continue;
                }

                scoreRepository.save(Score.builder()
                    .student(mapping.getStudent())
                    .exam(exam)
                    .schoolClass(schoolClass)
                    .teacher(teacher)
                    .scoreValue(BigDecimal.ZERO)
                    .status(DRAFT)
                    .build());
            }
        }
    }

    private Teacher resolveTeachingTeacher(
            String classCode,
            String subjectCode,
            String semesterCode,
            String academicYearCode,
            SchoolClass schoolClass) {
        TeachingAssignment assignment = teachingAssignmentRepository
            .findFirstBySchoolClass_ClassCodeIgnoreCaseAndSubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(
                normalizeCode(classCode),
                normalizeCode(subjectCode),
                normalizeCode(semesterCode),
                normalizeCode(academicYearCode)
            )
            .orElse(null);

        if (assignment != null && assignment.getTeacher() != null) {
            return assignment.getTeacher();
        }

        if (schoolClass.getHomeroomTeacher() != null) {
            return schoolClass.getHomeroomTeacher();
        }

        throw new CustomException("No teacher assignment found for class " + classCode + " and subject " + subjectCode, 400);
    }

    private Exam getExamEntity(String examId) {
        UUID id;
        try {
            id = UUID.fromString(examId);
        } catch (IllegalArgumentException exception) {
            throw new CustomException("Invalid exam id", 400);
        }

        return examRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new CustomException("Exam not found", 404));
    }

    private Semester resolveSemester(String semesterCode, String academicYearCode) {
        return semesterRepository.findByCodeAndAcademicYear_Code(normalizeCode(semesterCode), normalizeCode(academicYearCode))
            .orElseThrow(() -> new CustomException("Semester not found", 404));
    }

    private Subject resolveSubject(String subjectCode) {
        return subjectRepository.findByCodeAndDeletedAtIsNull(normalizeCode(subjectCode))
            .orElseThrow(() -> new CustomException("Subject not found", 404));
    }

    private void validateExamDate(LocalDate examDate) {
        if (examDate != null && examDate.isBefore(LocalDate.now())) {
            throw new CustomException("Exam date cannot be in the past", 400);
        }
    }

    private BigDecimal resolveWeight(BigDecimal requestWeight, ExamType examType, SystemSettingResponse setting) {
        if (requestWeight != null) {
            return requestWeight;
        }

        return switch (examType) {
            case ORAL -> BigDecimal.valueOf(setting.getOralWeight());
            case QUIZ_15 -> BigDecimal.valueOf(setting.getQuiz15Weight());
            case ONE_PERIOD -> BigDecimal.valueOf(setting.getOnePeriodWeight());
            case MIDTERM -> BigDecimal.valueOf(setting.getMidtermWeight());
            case FINAL -> BigDecimal.valueOf(setting.getFinalWeight());
            case SURVEY -> BigDecimal.ZERO;
        };
    }

    private String resolveStatus(String input) {
        if (input == null || input.trim().isEmpty()) {
            return DRAFT;
        }
        return input.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeCode(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new CustomException("Required code is missing", 400);
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private List<String> normalizeCodes(List<String> values) {
        if (values == null || values.isEmpty()) {
            throw new CustomException("Class list is required", 400);
        }
        return values.stream().map(this::normalizeCode).distinct().toList();
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

    private Teacher getCurrentTeacher() {
        return teacherRepository.findByUserAndDeletedAtIsNull(getCurrentUser())
            .orElseThrow(() -> new CustomException("Teacher profile not found", 403));
    }

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new CustomException("Unauthenticated", 401);
        }

        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch("ROLE_ADMIN"::equals);
    }

    private void assertCanAccessExam(Exam exam) {
        if (isCurrentUserAdmin()) {
            return;
        }

        Teacher teacher = getCurrentTeacher();
        Set<String> allowedAssignmentKeys = teachingAssignmentRepository
            .findByTeacherOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(teacher)
            .stream()
            .map(this::toAssignmentKey)
            .collect(Collectors.toSet());

        if (!canTeacherAccessExam(exam, allowedAssignmentKeys)) {
            throw new CustomException("Forbidden", 403);
        }
    }

    private void assertCanCreateExam(Semester semester, Subject subject, List<String> classCodes) {
        if (isCurrentUserAdmin()) {
            return;
        }

        Teacher teacher = getCurrentTeacher();
        Set<String> allowedAssignmentKeys = teachingAssignmentRepository
            .findByTeacherOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(teacher)
            .stream()
            .map(this::toAssignmentKey)
            .filter(item -> !item.isBlank())
            .collect(Collectors.toSet());

        for (String classCode : classCodes) {
            String examKey = buildAssignmentKey(
                semester.getAcademicYear().getCode(),
                semester.getCode(),
                subject.getCode(),
                classCode
            );
            if (!allowedAssignmentKeys.contains(examKey)) {
                throw new CustomException("Teacher cannot create exam for this class/subject/semester", 403);
            }
        }
    }

    private boolean canTeacherAccessExam(Exam exam, Set<String> allowedAssignmentKeys) {
        if (exam.getSemester() == null || exam.getSemester().getAcademicYear() == null || exam.getSubject() == null) {
            return false;
        }

        String academicYearCode = exam.getSemester().getAcademicYear().getCode();
        String semesterCode = exam.getSemester().getCode();
        String subjectCode = exam.getSubject().getCode();

        return examClassRepository.findByExam(exam).stream()
            .map(ExamClass::getSchoolClass)
            .filter(item -> item != null && item.getClassCode() != null)
            .map(item -> buildAssignmentKey(academicYearCode, semesterCode, subjectCode, item.getClassCode()))
            .anyMatch(allowedAssignmentKeys::contains);
    }

    private String toAssignmentKey(TeachingAssignment assignment) {
        if (assignment.getSemester() == null
                || assignment.getSemester().getAcademicYear() == null
                || assignment.getSubject() == null
                || assignment.getSchoolClass() == null) {
            return "";
        }

        return buildAssignmentKey(
            assignment.getSemester().getAcademicYear().getCode(),
            assignment.getSemester().getCode(),
            assignment.getSubject().getCode(),
            assignment.getSchoolClass().getClassCode()
        );
    }

    private String buildAssignmentKey(String academicYearCode, String semesterCode, String subjectCode, String classCode) {
        return String.join(
            "::",
            normalizeCode(academicYearCode),
            normalizeCode(semesterCode),
            normalizeCode(subjectCode),
            normalizeCode(classCode)
        );
    }

    private ExamResponse toResponse(Exam exam) {
        ExamType examType = ExamType.fromString(exam.getExamType());
        Set<String> classCodes = examClassRepository.findByExam(exam).stream()
            .map(ExamClass::getSchoolClass)
            .filter(item -> item != null && item.getClassCode() != null)
            .map(SchoolClass::getClassCode)
            .collect(Collectors.toSet());

        return ExamResponse.builder()
            .examId(exam.getId().toString())
            .semesterCode(exam.getSemester() != null ? exam.getSemester().getCode() : "")
            .academicYearCode(exam.getSemester() != null && exam.getSemester().getAcademicYear() != null
                ? exam.getSemester().getAcademicYear().getCode()
                : "")
            .subjectCode(exam.getSubject() != null ? exam.getSubject().getCode() : "")
            .subjectName(exam.getSubject() != null ? exam.getSubject().getName() : "")
            .examType(examType.name())
            .examTypeLabel(examType.getDisplayName())
            .assessmentGroup(examType.isWeighted() ? "ACADEMIC" : "SURVEY")
            .title(exam.getTitle())
            .examDate(exam.getExamDate())
            .weight(exam.getWeight())
            .editWindowDays(exam.getEditWindowDays())
            .status(exam.getStatus())
            .classCodes(classCodes.stream().sorted().toList())
            .build();
    }
}
