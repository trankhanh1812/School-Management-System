package com.school.school_management.service.teacher;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.school.school_management.dto.teacher.AvailableHomeroomTeacherResponse;
import com.school.school_management.dto.teacher.TeacherAssignmentResponse;
import com.school.school_management.dto.teacher.TeacherDepartmentResponse;
import com.school.school_management.dto.teacher.TeacherMetricResponse;
import com.school.school_management.dto.teacher.TeacherResponse;
import com.school.school_management.dto.teacher.TeacherUpsertRequest;
import com.school.school_management.entity.Department;
import com.school.school_management.entity.Role;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.TeachingAssignment;
import com.school.school_management.entity.User;
import com.school.school_management.entity.UserRole;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.DepartmentRepository;
import com.school.school_management.repository.RoleRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import com.school.school_management.repository.UserRepository;

@Service
@Transactional
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public TeacherServiceImpl(
            TeacherRepository teacherRepository,
            DepartmentRepository departmentRepository,
            TeachingAssignmentRepository teachingAssignmentRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.teacherRepository = teacherRepository;
        this.departmentRepository = departmentRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getTeachers(String departmentQuery, String search, Integer limit) {
        String resolvedDepartment = normalizeOptionalCodeOrTextUpper(departmentQuery);
        String resolvedSearchPattern = normalizeSearchPattern(search);
        int pageSize = normalizeLimit(limit, 80, 500);

        return teacherRepository.searchTeachers(
                isBlank(resolvedDepartment) ? null : resolvedDepartment,
            isBlank(resolvedSearchPattern) ? null : resolvedSearchPattern,
                PageRequest.of(0, pageSize)
            )
            .stream()
            .map(this::toTeacherResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherResponse getTeacherByCode(String teacherCode) {
        Teacher teacher = teacherRepository.findByTeacherCodeAndDeletedAtIsNull(normalizeCode(teacherCode))
            .orElseThrow(() -> new CustomException("Teacher not found", 404));

        return toTeacherResponse(teacher);
    }

    @Override
    public TeacherResponse createTeacher(TeacherUpsertRequest request) {
        String teacherCode = normalizeCode(request.getTeacherCode());
        if (teacherRepository.existsByTeacherCodeAndDeletedAtIsNull(teacherCode)) {
            throw new CustomException("Teacher code already exists", 409);
        }

        String email = normalizeEmail(request.getEmail(), teacherCode);
        ensureEmailAvailable(email, null);

        User user = User.builder()
            .username(buildUsername(request.getPhone(), teacherCode))
            .email(email)
            .passwordHash(passwordEncoder.encode(teacherCode))
            .fullName(normalizeText(request.getFullName(), "Full name is required"))
            .status(defaultStatus(request.getStatus()))
            // Mật khẩu mặc định = mã giáo viên (dễ đoán) → buộc đổi ở lần đăng nhập đầu.
            .forcePasswordChange(true)
            .build();

        Role role = getOrCreateTeacherRole();
        user.getUserRoles().add(
            UserRole.builder()
                .user(user)
                .role(role)
                .build()
        );

        User savedUser = userRepository.save(user);
        NameParts nameParts = splitFullName(request.getFullName());

        Teacher teacher = Teacher.builder()
            .user(savedUser)
            .teacherCode(teacherCode)
            .department(resolveDepartment(request.getDepartmentCode()))
            .firstName(nameParts.firstName())
            .lastName(nameParts.lastName())
            .status(defaultStatus(request.getStatus()))
            .departmentLevel(request.getDepartmentLevel() != null ? request.getDepartmentLevel() : 3)
            .build();

        return toTeacherResponse(teacherRepository.save(teacher));
    }

    @Override
    public TeacherResponse updateTeacher(String teacherCode, TeacherUpsertRequest request) {
        Teacher teacher = getTeacherEntity(teacherCode);
        String nextTeacherCode = normalizeCode(request.getTeacherCode());

        if (!teacher.getTeacherCode().equalsIgnoreCase(nextTeacherCode)
                && teacherRepository.existsByTeacherCodeAndDeletedAtIsNull(nextTeacherCode)) {
            throw new CustomException("Teacher code already exists", 409);
        }

        String email = normalizeEmail(request.getEmail(), nextTeacherCode);
        ensureEmailAvailable(email, teacher.getUser() != null ? teacher.getUser().getId() : null);

        NameParts nameParts = splitFullName(request.getFullName());
        teacher.setTeacherCode(nextTeacherCode);
        teacher.setDepartment(resolveDepartment(request.getDepartmentCode()));
        teacher.setFirstName(nameParts.firstName());
        teacher.setLastName(nameParts.lastName());
        teacher.setStatus(defaultStatus(request.getStatus()));
        teacher.setDepartmentLevel(request.getDepartmentLevel() != null ? request.getDepartmentLevel() : 3);

        if (teacher.getUser() != null) {
            teacher.getUser().setEmail(email);
            teacher.getUser().setUsername(buildUsername(request.getPhone(), nextTeacherCode));
            teacher.getUser().setFullName(normalizeText(request.getFullName(), "Full name is required"));
            teacher.getUser().setStatus(defaultStatus(request.getStatus()));
        }

        return toTeacherResponse(teacherRepository.save(teacher));
    }

    @Override
    public void deleteTeacher(String teacherCode) {
        Teacher teacher = getTeacherEntity(teacherCode);
        OffsetDateTime now = OffsetDateTime.now();
        UUID deletedBy = getCurrentUserId();

        teacher.setDeletedAt(now);
        teacher.setDeletedBy(deletedBy);

        if (teacher.getUser() != null) {
            teacher.getUser().setDeletedAt(now);
            teacher.getUser().setDeletedBy(deletedBy);
            teacher.getUser().setStatus("INACTIVE");
        }

        teacherRepository.save(teacher);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherDepartmentResponse> getDepartments() {
        return departmentRepository.findAllByOrderByNameAsc()
            .stream()
            .map(this::toDepartmentResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherMetricResponse> getMetrics() {
        long activeTeachers = teacherRepository.countActiveByStatusSafe("ACTIVE");
        long departments = departmentRepository.count();
        long assignments = teachingAssignmentRepository.countByTeacher_DeletedAtIsNull();
        long homeroomTeachers = teacherRepository.findAllByDeletedAtIsNullOrderByTeacherCodeAsc()
            .stream()
            .filter(teacher -> !teacher.getHomeroomClasses().isEmpty())
            .count();

        return List.of(
            TeacherMetricResponse.builder()
                .label("Giáo viên hoạt động")
                .value(String.valueOf(activeTeachers))
                .trend("Realtime")
                .note("Số giáo viên còn hiệu lực trong hệ thống.")
                .build(),
            TeacherMetricResponse.builder()
                .label("Bộ môn đang quản lý")
                .value(String.valueOf(departments))
                .trend("Ổn định")
                .note("Tổng số bộ môn đang có trong dữ liệu hiện tại.")
                .build(),
            TeacherMetricResponse.builder()
                .label("Phân công đang mở")
                .value(String.valueOf(assignments))
                .trend("Realtime")
                .note("Số teaching assignment đang được lưu trên hệ thống.")
                .build(),
            TeacherMetricResponse.builder()
                .label("Giáo viên chủ nhiệm")
                .value(String.valueOf(homeroomTeachers))
                .trend("Realtime")
                .note("Số giáo viên đang giữ vai trò chủ nhiệm lớp.")
                .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableHomeroomTeacherResponse> getAvailableHomeroomTeachers() {
        return teacherRepository.findAvailableHomeroomTeachers()
            .stream()
            .map(this::toAvailableHomeroomTeacherResponse)
            .toList();
    }

    private TeacherResponse toTeacherResponse(Teacher teacher) {
        List<TeacherAssignmentResponse> assignments = teacher.getTeachingAssignments().stream()
            .sorted(
                Comparator.comparing(
                    (TeachingAssignment item) -> item.getSemester() != null && item.getSemester().getAcademicYear() != null
                        ? safe(item.getSemester().getAcademicYear().getCode(), "")
                        : "",
                    Comparator.reverseOrder()
                ).thenComparing(
                    item -> item.getSemester() != null ? safe(item.getSemester().getCode(), "") : ""
                )
            )
            .map(this::toAssignmentResponse)
            .toList();

        Set<String> subjects = teacher.getTeachingAssignments().stream()
            .map(TeachingAssignment::getSubject)
            .filter(Objects::nonNull)
            .map(subject -> safe(subject.getName(), "Chưa cập nhật"))
            .collect(Collectors.toCollection(java.util.LinkedHashSet::new));

        return TeacherResponse.builder()
            .id(teacher.getId() != null ? teacher.getId().toString() : normalizeCode(teacher.getTeacherCode()))
            .teacherCode(safe(teacher.getTeacherCode(), "GV000"))
            .fullName(resolveTeacherName(teacher))
            .department(teacher.getDepartment() != null ? safe(teacher.getDepartment().getName(), "Chưa cập nhật") : "Chưa cập nhật")
            .departmentLevel(teacher.getDepartmentLevel() != null ? teacher.getDepartmentLevel() : 3)
            .title(resolveTeacherTitle(teacher))
            .phone(teacher.getUser() != null ? safe(teacher.getUser().getUsername(), "Chưa cập nhật") : "Chưa cập nhật")
            .email(teacher.getUser() != null ? safe(teacher.getUser().getEmail(), "Chưa cập nhật") : "Chưa cập nhật")
            .homeroomClass(resolveHomeroomClass(teacher))
            .subjects(subjects.isEmpty() ? List.of("Chưa cập nhật") : List.copyOf(subjects))
            .employmentStatus(safe(teacher.getStatus(), "ACTIVE"))
            .bio(buildBio(teacher))
            .assignments(assignments)
            .build();
    }

    private TeacherAssignmentResponse toAssignmentResponse(TeachingAssignment assignment) {
        String academicYear = assignment.getSemester() != null && assignment.getSemester().getAcademicYear() != null
            ? safe(assignment.getSemester().getAcademicYear().getCode(), "2026-2027")
            : "2026-2027";

        return TeacherAssignmentResponse.builder()
            .academicYear(formatAcademicYear(academicYear))
            .semester(normalizeSemester(assignment.getSemester() != null ? assignment.getSemester().getCode() : null))
            .className(assignment.getSchoolClass() != null ? safe(assignment.getSchoolClass().getClassName(), "Chưa cập nhật") : "Chưa cập nhật")
            .subject(assignment.getSubject() != null ? safe(assignment.getSubject().getName(), "Chưa cập nhật") : "Chưa cập nhật")
            .room("Chưa cập nhật")
            .periods("Chưa cập nhật")
            .build();
    }

    private TeacherDepartmentResponse toDepartmentResponse(Department department) {
        List<Teacher> teachers = department.getTeachers().stream()
            .filter(teacher -> teacher.getDeletedAt() == null)
            .sorted(Comparator.comparing(this::resolveTeacherName))
            .toList();

        return TeacherDepartmentResponse.builder()
            .id(department.getId() != null ? department.getId().toString() : safe(department.getCode(), department.getName()))
            .name(safe(department.getName(), "Chưa cập nhật"))
            .headTeacher(!teachers.isEmpty() ? resolveTeacherName(teachers.get(0)) : "Chưa cập nhật")
            .viceHeadTeacher(teachers.size() > 1 ? resolveTeacherName(teachers.get(1)) : "Chưa cập nhật")
            .teacherCount(teachers.size())
            .subjectCount((int) department.getSubjects().stream().filter(subject -> subject.getDeletedAt() == null).count())
            .build();
    }

    private String resolveTeacherName(Teacher teacher) {
        if (teacher == null) {
            return "Chưa cập nhật";
        }

        if (teacher.getUser() != null && !isBlank(teacher.getUser().getFullName())) {
            return teacher.getUser().getFullName().trim();
        }

        String firstName = safe(teacher.getFirstName(), "");
        String lastName = safe(teacher.getLastName(), "");
        String fullName = (lastName + " " + firstName).trim();
        return isBlank(fullName) ? "Chưa cập nhật" : fullName;
    }

    private String resolveTeacherTitle(Teacher teacher) {
        if (!teacher.getHomeroomClasses().isEmpty()) {
            return "Giáo viên chủ nhiệm";
        }
        return "Giáo viên bộ môn";
    }

    private String resolveHomeroomClass(Teacher teacher) {
        return teacher.getHomeroomClasses().stream()
            .filter(item -> item.getDeletedAt() == null)
            .map(item -> safe(item.getClassName(), ""))
            .filter(value -> !isBlank(value))
            .findFirst()
            .orElse("");
    }

    private String buildBio(Teacher teacher) {
        String department = teacher.getDepartment() != null ? safe(teacher.getDepartment().getName(), "bộ môn") : "bộ môn";
        return "Phụ trách giảng dạy và điều phối chuyên môn " + department.toLowerCase(Locale.ROOT) + ".";
    }

    private String normalizeCode(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private String normalizeOptionalCodeOrTextUpper(String value) {
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

    private Teacher getTeacherEntity(String teacherCode) {
        return teacherRepository.findByTeacherCodeAndDeletedAtIsNull(normalizeCode(teacherCode))
            .orElseThrow(() -> new CustomException("Teacher not found", 404));
    }

    private Department resolveDepartment(String departmentCode) {
        if (isBlank(departmentCode)) {
            return null;
        }

        return departmentRepository.findByCode(departmentCode.trim().toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Department not found", 404));
    }

    private String normalizeEmail(String value, String teacherCode) {
        if (isBlank(value)) {
            return teacherCode.toLowerCase(Locale.ROOT) + "@sms.local";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String buildUsername(String phone, String teacherCode) {
        if (!isBlank(phone)) {
            return phone.trim();
        }
        return teacherCode.toLowerCase(Locale.ROOT);
    }

    private Role getOrCreateTeacherRole() {
        return roleRepository.findByCode("TEACHER").orElseGet(() ->
            roleRepository.save(
                Role.builder()
                    .code("TEACHER")
                    .name("Giáo viên")
                    .description("Default teacher role")
                    .build()
            )
        );
    }

    private void ensureEmailAvailable(String email, UUID currentUserId) {
        userRepository.findByEmail(email).ifPresent(existingUser -> {
            if (currentUserId == null || !existingUser.getId().equals(currentUserId)) {
                throw new CustomException("Email already exists", 409);
            }
        });
    }

    private String normalizeText(String value, String errorMessage) {
        if (isBlank(value)) {
            throw new CustomException(errorMessage, 400);
        }
        return value.trim();
    }

    private String defaultStatus(String value) {
        return isBlank(value) ? "ACTIVE" : value.trim().toUpperCase(Locale.ROOT);
    }

    private NameParts splitFullName(String fullName) {
        String normalized = normalizeText(fullName, "Full name is required");
        String[] parts = normalized.split("\\s+");
        if (parts.length == 1) {
            return new NameParts(parts[0], "");
        }

        String firstName = parts[parts.length - 1];
        String lastName = normalized.substring(0, normalized.length() - firstName.length()).trim();
        return new NameParts(firstName, lastName);
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

    private String normalizeSemester(String value) {
        if (isBlank(value)) {
            return "Học kỳ I";
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (normalized.contains("2") || normalized.contains("II")) {
            return "Học kỳ II";
        }
        return "Học kỳ I";
    }

    private AvailableHomeroomTeacherResponse toAvailableHomeroomTeacherResponse(Teacher teacher) {
        return AvailableHomeroomTeacherResponse.builder()
            .teacherCode(safe(teacher.getTeacherCode(), ""))
            .fullName(resolveTeacherName(teacher))
            .department(teacher.getDepartment() != null ? safe(teacher.getDepartment().getName(), "Chưa cập nhật") : "Chưa cập nhật")
            .build();
    }

    private record NameParts(String firstName, String lastName) {
    }
}
