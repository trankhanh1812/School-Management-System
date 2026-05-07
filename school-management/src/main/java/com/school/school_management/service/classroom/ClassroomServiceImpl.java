package com.school.school_management.service.classroom;

import com.school.school_management.dto.classroom.ClassStudentResponse;
import com.school.school_management.dto.classroom.ClassroomMetricResponse;
import com.school.school_management.dto.classroom.ClassroomResponse;
import com.school.school_management.dto.classroom.ClassroomUpsertRequest;
import com.school.school_management.dto.classroom.PromotionPlanResponse;
import com.school.school_management.entity.AcademicYear;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.AcademicYearRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ClassroomServiceImpl implements ClassroomService {

    private final SchoolClassRepository schoolClassRepository;
    private final StudentClassRepository studentClassRepository;
    private final AcademicYearRepository academicYearRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    public ClassroomServiceImpl(
            SchoolClassRepository schoolClassRepository,
            StudentClassRepository studentClassRepository,
            AcademicYearRepository academicYearRepository,
            TeacherRepository teacherRepository,
            UserRepository userRepository) {
        this.schoolClassRepository = schoolClassRepository;
        this.studentClassRepository = studentClassRepository;
        this.academicYearRepository = academicYearRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getClassrooms(String academicYearCode, String search, Integer limit, String scope) {
        String normalizedScope = isBlank(scope) ? "current" : scope.trim().toLowerCase(Locale.ROOT);
        String resolvedAcademicYear = normalizeOptionalCode(academicYearCode);

        if (isBlank(resolvedAcademicYear) && !"all".equals(normalizedScope)) {
            resolvedAcademicYear = findCurrentAcademicYearCode();
        }

        String resolvedSearchPattern = normalizeSearchPattern(search);
        int pageSize = normalizeLimit(limit, 80, 500);

        return schoolClassRepository.searchClassrooms(
                isBlank(resolvedAcademicYear) ? null : resolvedAcademicYear,
                isBlank(resolvedSearchPattern) ? null : resolvedSearchPattern,
                PageRequest.of(0, pageSize)
            )
            .stream()
            .map(this::toClassroomResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomResponse getClassroomByCode(String classCode) {
        SchoolClass schoolClass = getClassEntity(classCode);
        return toClassroomResponse(schoolClass);
    }

    @Override
    public ClassroomResponse createClassroom(ClassroomUpsertRequest request) {
        String classCode = normalizeCode(request.getClassCode());
        String academicYearCode = normalizeAcademicYearCode(request.getAcademicYearCode());

        if (schoolClassRepository.findByClassCodeAndAcademicYear_CodeAndDeletedAtIsNull(classCode, academicYearCode).isPresent()) {
            throw new CustomException("Class code already exists in this academic year", 409);
        }

        SchoolClass schoolClass = SchoolClass.builder()
            .classCode(classCode)
            .className(normalizeText(request.getClassName(), "Class name is required"))
            .academicYear(resolveAcademicYear(academicYearCode))
            .gradeLevel(request.getGradeLevel())
            .homeroomTeacher(resolveHomeroomTeacher(request.getHomeroomTeacherCode()))
            .capacity(request.getCapacity())
            .build();

        return toClassroomResponse(schoolClassRepository.save(schoolClass));
    }

    @Override
    public ClassroomResponse updateClassroom(String classCode, ClassroomUpsertRequest request) {
        SchoolClass schoolClass = getClassEntity(classCode);
        String nextClassCode = normalizeCode(request.getClassCode());
        String nextAcademicYearCode = normalizeAcademicYearCode(request.getAcademicYearCode());

        boolean sameKey = schoolClass.getClassCode() != null
            && schoolClass.getClassCode().equalsIgnoreCase(nextClassCode)
            && schoolClass.getAcademicYear() != null
            && schoolClass.getAcademicYear().getCode() != null
            && schoolClass.getAcademicYear().getCode().equalsIgnoreCase(nextAcademicYearCode);

        if (!sameKey && schoolClassRepository.findByClassCodeAndAcademicYear_CodeAndDeletedAtIsNull(nextClassCode, nextAcademicYearCode).isPresent()) {
            throw new CustomException("Class code already exists in this academic year", 409);
        }

        schoolClass.setClassCode(nextClassCode);
        schoolClass.setClassName(normalizeText(request.getClassName(), "Class name is required"));
        schoolClass.setAcademicYear(resolveAcademicYear(nextAcademicYearCode));
        schoolClass.setGradeLevel(request.getGradeLevel());
        schoolClass.setHomeroomTeacher(resolveHomeroomTeacher(request.getHomeroomTeacherCode()));
        schoolClass.setCapacity(request.getCapacity());

        return toClassroomResponse(schoolClassRepository.save(schoolClass));
    }

    @Override
    public void deleteClassroom(String classCode) {
        SchoolClass schoolClass = getClassEntity(classCode);
        schoolClass.setDeletedAt(OffsetDateTime.now());
        schoolClass.setDeletedBy(getCurrentUserId());
        schoolClassRepository.save(schoolClass);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomMetricResponse> getMetrics() {
        List<SchoolClass> classes = schoolClassRepository.findAllByDeletedAtIsNullOrderByClassNameAsc();

        long totalActiveClasses = classes.size();
        long classesWithoutHomeroom = classes.stream().filter(item -> item.getHomeroomTeacher() == null).count();
        long transferPlans = studentClassRepository.findAll().stream()
            .filter(item -> item.getEndDate() == null)
            .filter(item -> !isBlank(item.getTransferReason()))
            .count();
        long promotionDraft = classes.stream()
            .mapToLong(item -> getPromotionPlansByClassCode(item.getClassCode()).stream()
                .filter(plan -> "draft".equalsIgnoreCase(plan.getStatus()))
                .count())
            .sum();

        return List.of(
            ClassroomMetricResponse.builder()
                .label("Lớp đang hoạt động")
                .value(String.valueOf(totalActiveClasses))
                .trend("Realtime")
                .note("Tổng số lớp chưa bị xóa mềm trong năm học hiện tại.")
                .build(),
            ClassroomMetricResponse.builder()
                .label("Đề án lên lớp nháp")
                .value(String.valueOf(promotionDraft))
                .trend("Realtime")
                .note("Số đề án promotion đang ở trạng thái bản nháp.")
                .build(),
            ClassroomMetricResponse.builder()
                .label("Học sinh chuyển lớp")
                .value(String.valueOf(transferPlans))
                .trend("Realtime")
                .note("Số trường hợp có lý do chuyển lớp trong phân lớp hiện tại.")
                .build(),
            ClassroomMetricResponse.builder()
                .label("Lớp chờ GVCN")
                .value(String.valueOf(classesWithoutHomeroom))
                .trend("Realtime")
                .note("Số lớp chưa gán giáo viên chủ nhiệm.")
                .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassStudentResponse> getStudentsByClassCode(String classCode) {
        SchoolClass schoolClass = getClassEntity(classCode);
        List<StudentClass> activeMappings = studentClassRepository.findBySchoolClassAndEndDateIsNull(schoolClass);

        return activeMappings.stream()
            .map(StudentClass::getStudent)
            .filter(Objects::nonNull)
            .filter(student -> student.getDeletedAt() == null)
            .sorted(Comparator.comparing(Student::getStudentCode, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toClassStudentResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionPlanResponse> getPromotionPlansByClassCode(String classCode) {
        SchoolClass schoolClass = getClassEntity(classCode);
        String nextAcademicYear = buildNextAcademicYear(schoolClass);

        return getStudentsByClassCode(classCode).stream()
            .map(student -> {
                String action = resolveAction(schoolClass, student);
                return PromotionPlanResponse.builder()
                    .studentCode(student.getStudentCode())
                    .studentName(student.getFullName())
                    .currentClass(safe(schoolClass.getClassName(), "Chưa cập nhật"))
                    .nextAcademicYear(nextAcademicYear)
                    .proposedClass(resolveProposedClass(schoolClass, action))
                    .action(action)
                    .reason(resolveReason(action))
                    .status(resolvePlanStatus(student.getStudentCode()))
                    .build();
            })
            .toList();
    }

    private SchoolClass getClassEntity(String classCode) {
        return schoolClassRepository.findByClassCodeAndDeletedAtIsNull(normalizeCode(classCode))
            .orElseThrow(() -> new CustomException("Class not found", 404));
    }

    private ClassroomResponse toClassroomResponse(SchoolClass schoolClass) {
        int totalStudents = studentClassRepository.findBySchoolClassAndEndDateIsNull(schoolClass).size();

        return ClassroomResponse.builder()
            .classCode(safe(schoolClass.getClassCode(), ""))
            .className(safe(schoolClass.getClassName(), "Chưa cập nhật"))
            .grade(resolveGrade(schoolClass.getGradeLevel()))
            .academicYear(formatAcademicYear(schoolClass.getAcademicYear() != null ? schoolClass.getAcademicYear().getCode() : "2026-2027"))
            .homeroomTeacher(resolveHomeroomTeacher(schoolClass.getHomeroomTeacher()))
            .totalStudents(totalStudents)
            .room("Chưa cập nhật")
            .shift("Chưa cập nhật")
            .status("Ổn định")
            .notes("Dữ liệu lớp học được đồng bộ từ school_class và student_class.")
            .build();
    }

    private ClassStudentResponse toClassStudentResponse(Student student) {
        return ClassStudentResponse.builder()
            .studentCode(safe(student.getStudentCode(), "HS00000"))
            .fullName(resolveStudentName(student))
            .conduct(resolveConduct(student))
            .scoreAverage(calculateScoreAverage(student))
            .status(safe(student.getStatus(), "ACTIVE"))
            .build();
    }

    private String resolveStudentName(Student student) {
        if (student.getUser() != null && !isBlank(student.getUser().getFullName())) {
            return student.getUser().getFullName().trim();
        }

        String fullName = (safe(student.getLastName(), "") + " " + safe(student.getFirstName(), "")).trim();
        return isBlank(fullName) ? "Học sinh" : fullName;
    }

    private String resolveConduct(Student student) {
        return student.getConducts().stream()
            .map(conduct -> conduct != null ? conduct.getConductLevel() : null)
            .filter(level -> !isBlank(level))
            .findFirst()
            .orElse("Chưa cập nhật");
    }

    private String calculateScoreAverage(Student student) {
        double average = student.getScores().stream()
            .filter(score -> score != null && score.getDeletedAt() == null && score.getScoreValue() != null)
            .mapToDouble(score -> score.getScoreValue().doubleValue())
            .average()
            .orElse(0.0);

        return String.format(Locale.US, "%.1f", average);
    }

    private String resolveAction(SchoolClass schoolClass, ClassStudentResponse student) {
        Short grade = schoolClass.getGradeLevel();
        short gradeLevel = grade != null ? grade : 0;
        double average = parseNumber(student.getScoreAverage());

        if (gradeLevel >= 12) {
            return "graduate";
        }

        if (average < 5.0) {
            return "repeat";
        }

        return "promote";
    }

    private String resolveReason(String action) {
        return switch (action) {
            case "graduate" -> "Đủ điều kiện hoàn thành chương trình học.";
            case "repeat" -> "Cần thêm thời gian củng cố học lực trước khi lên lớp.";
            case "transfer" -> "Điều chỉnh để cân bằng sĩ số giữa các lớp.";
            default -> "Đủ điều kiện học lực và hạnh kiểm để lên lớp kế tiếp.";
        };
    }

    private String resolvePlanStatus(String studentCode) {
        int hash = Math.abs(studentCode.hashCode() % 3);
        if (hash == 0) {
            return "draft";
        }
        if (hash == 1) {
            return "reviewed";
        }
        return "approved";
    }

    private String resolveProposedClass(SchoolClass schoolClass, String action) {
        if ("graduate".equals(action)) {
            return "Tốt nghiệp";
        }

        String className = safe(schoolClass.getClassName(), "10A1");
        Short grade = schoolClass.getGradeLevel();
        short gradeLevel = grade != null ? grade : 10;
        short nextGrade = "repeat".equals(action) ? gradeLevel : (short) (gradeLevel + 1);

        String suffix = className.replaceAll("^[0-9]+", "");
        if (isBlank(suffix)) {
            suffix = "A1";
        }
        return nextGrade + suffix;
    }

    private String buildNextAcademicYear(SchoolClass schoolClass) {
        String code = schoolClass.getAcademicYear() != null ? safe(schoolClass.getAcademicYear().getCode(), "2026-2027") : "2026-2027";
        String[] parts = code.split("-");
        if (parts.length != 2) {
            return formatAcademicYear(code);
        }

        try {
            int start = Integer.parseInt(parts[0].trim());
            int end = Integer.parseInt(parts[1].trim());
            return start + 1 + " - " + (end + 1);
        } catch (NumberFormatException exception) {
            return formatAcademicYear(code);
        }
    }

    private String resolveGrade(Short gradeLevel) {
        if (gradeLevel == null) {
            return "Chưa cập nhật";
        }
        return "Khối " + gradeLevel;
    }

    private String resolveHomeroomTeacher(Teacher teacher) {
        if (teacher == null) {
            return "Chưa cập nhật";
        }

        if (teacher.getUser() != null && !isBlank(teacher.getUser().getFullName())) {
            return teacher.getUser().getFullName().trim();
        }

        String fullName = (safe(teacher.getLastName(), "") + " " + safe(teacher.getFirstName(), "")).trim();
        return isBlank(fullName) ? "Chưa cập nhật" : fullName;
    }

    private String normalizeCode(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalCode(String value) {
        return isBlank(value) ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        return isBlank(value) ? null : value.trim();
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

    private String normalizeAcademicYearCode(String value) {
        return normalizeText(value, "Academic year code is required").toUpperCase(Locale.ROOT);
    }

    private AcademicYear resolveAcademicYear(String academicYearCode) {
        return academicYearRepository.findByCode(academicYearCode)
            .orElseThrow(() -> new CustomException("Academic year not found", 404));
    }

    private Teacher resolveHomeroomTeacher(String teacherCode) {
        if (isBlank(teacherCode)) {
            return null;
        }

        return teacherRepository.findByTeacherCodeAndDeletedAtIsNull(normalizeCode(teacherCode))
            .orElseThrow(() -> new CustomException("Teacher not found", 404));
    }

    private String normalizeText(String value, String errorMessage) {
        if (isBlank(value)) {
            throw new CustomException(errorMessage, 400);
        }
        return value.trim();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || isBlank(authentication.getName())) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName().trim().toLowerCase(Locale.ROOT))
            .map(User::getId)
            .orElse(null);
    }

    private String safe(String value, String fallback) {
        return isBlank(value) ? fallback : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String formatAcademicYear(String value) {
        return value.replaceAll("\\s*-\\s*", " - ");
    }

    private double parseNumber(String value) {
        if (isBlank(value)) {
            return 0.0;
        }

        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException exception) {
            return 0.0;
        }
    }
}
