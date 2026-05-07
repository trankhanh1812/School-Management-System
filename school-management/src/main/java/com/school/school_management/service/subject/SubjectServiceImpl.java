package com.school.school_management.service.subject;

import com.school.school_management.dto.subject.SubjectMetricResponse;
import com.school.school_management.dto.subject.SubjectResponse;
import com.school.school_management.dto.subject.SubjectUpsertRequest;
import com.school.school_management.entity.Department;
import com.school.school_management.entity.Subject;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.DepartmentRepository;
import com.school.school_management.repository.SubjectRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import com.school.school_management.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final UserRepository userRepository;

    public SubjectServiceImpl(
            SubjectRepository subjectRepository,
            DepartmentRepository departmentRepository,
            TeachingAssignmentRepository teachingAssignmentRepository,
            UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.departmentRepository = departmentRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjects() {
        return subjectRepository.findAllByDeletedAtIsNullOrderByNameAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponse getSubjectByCode(String subjectCode) {
        return toResponse(getSubjectEntity(subjectCode));
    }

    @Override
    public SubjectResponse createSubject(SubjectUpsertRequest request) {
        String code = normalizeCode(request.getCode());
        if (subjectRepository.existsByCodeAndDeletedAtIsNull(code)) {
            throw new CustomException("Subject code already exists", 409);
        }

        Subject subject = Subject.builder()
            .code(code)
            .name(normalizeText(request.getName(), "Subject name is required"))
            .department(resolveDepartment(request.getDepartmentCode()))
            .gradeLevel(request.getGradeLevel())
            .build();

        return toResponse(subjectRepository.save(subject));
    }

    @Override
    public SubjectResponse updateSubject(String subjectCode, SubjectUpsertRequest request) {
        Subject subject = getSubjectEntity(subjectCode);
        String nextCode = normalizeCode(request.getCode());

        if (!nextCode.equalsIgnoreCase(subject.getCode())
                && subjectRepository.existsByCodeAndDeletedAtIsNull(nextCode)) {
            throw new CustomException("Subject code already exists", 409);
        }

        subject.setCode(nextCode);
        subject.setName(normalizeText(request.getName(), "Subject name is required"));
        subject.setDepartment(resolveDepartment(request.getDepartmentCode()));
        subject.setGradeLevel(request.getGradeLevel());

        return toResponse(subjectRepository.save(subject));
    }

    @Override
    public void deleteSubject(String subjectCode) {
        Subject subject = getSubjectEntity(subjectCode);
        subject.setDeletedAt(OffsetDateTime.now());
        subject.setDeletedBy(getCurrentUserId());
        subjectRepository.save(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectMetricResponse> getMetrics() {
        List<Subject> subjects = subjectRepository.findAllByDeletedAtIsNullOrderByNameAsc();
        long grade10Count = subjects.stream().filter(item -> item.getGradeLevel() != null && item.getGradeLevel() == 10).count();
        long grade11Count = subjects.stream().filter(item -> item.getGradeLevel() != null && item.getGradeLevel() == 11).count();
        long grade12Count = subjects.stream().filter(item -> item.getGradeLevel() != null && item.getGradeLevel() == 12).count();

        return List.of(
            SubjectMetricResponse.builder()
                .label("Môn học đang hoạt động")
                .value(String.valueOf(subjects.size()))
                .trend("Realtime")
                .note("Số môn học còn hiệu lực trong hệ thống.")
                .build(),
            SubjectMetricResponse.builder()
                .label("Phân công giảng dạy")
                .value(String.valueOf(teachingAssignmentRepository.count()))
                .trend("Realtime")
                .note("Tổng số teaching assignment đã được khai báo.")
                .build(),
            SubjectMetricResponse.builder()
                .label("Môn khối 10")
                .value(String.valueOf(grade10Count))
                .trend("Ổn định")
                .note("Số môn áp dụng chính cho khối 10.")
                .build(),
            SubjectMetricResponse.builder()
                .label("Môn khối 11-12")
                .value(String.valueOf(grade11Count + grade12Count))
                .trend("Ổn định")
                .note("Số môn áp dụng cho khối 11 và 12.")
                .build()
        );
    }

    private Subject getSubjectEntity(String subjectCode) {
        return subjectRepository.findByCodeAndDeletedAtIsNull(normalizeCode(subjectCode))
            .orElseThrow(() -> new CustomException("Subject not found", 404));
    }

    private SubjectResponse toResponse(Subject subject) {
        int assignmentCount = (int) subject.getTeachingAssignments().stream().count();
        return SubjectResponse.builder()
            .code(safe(subject.getCode(), ""))
            .name(safe(subject.getName(), "Chưa cập nhật"))
            .departmentCode(subject.getDepartment() != null ? safe(subject.getDepartment().getCode(), "") : "")
            .departmentName(subject.getDepartment() != null ? safe(subject.getDepartment().getName(), "Chưa cập nhật") : "Chưa cập nhật")
            .gradeLevel(subject.getGradeLevel())
            .status(subject.getDeletedAt() == null ? "ACTIVE" : "INACTIVE")
            .assignmentCount(assignmentCount)
            .build();
    }

    private String normalizeCode(String value) {
        return normalizeText(value, "Subject code is required").toUpperCase(Locale.ROOT);
    }

    private Department resolveDepartment(String departmentCode) {
        return departmentRepository.findByCode(normalizeText(departmentCode, "Department code is required").toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Department not found", 404));
    }

    private String normalizeText(String value, String errorMessage) {
        if (value == null || value.trim().isEmpty()) {
            throw new CustomException(errorMessage, 400);
        }
        return value.trim();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName().trim().toLowerCase(Locale.ROOT))
            .map(User::getId)
            .orElse(null);
    }

    private String safe(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}
