package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.exam.ExamPermissionResponse;
import com.school.school_management.dto.exam.ExamPermissionUpsertRequest;
import com.school.school_management.entity.Exam;
import com.school.school_management.entity.ExamPermission;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.ExamPermissionRepository;
import com.school.school_management.repository.ExamRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.UserRepository;
import jakarta.validation.Valid;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/exam-permissions")
public class ExamPermissionController {

    private final ExamPermissionRepository examPermissionRepository;
    private final ExamRepository examRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public ExamPermissionController(
            ExamPermissionRepository examPermissionRepository,
            ExamRepository examRepository,
            StudentRepository studentRepository,
            UserRepository userRepository) {
        this.examPermissionRepository = examPermissionRepository;
        this.examRepository = examRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    /** Danh sách tất cả exam permissions — ADMIN */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ExamPermissionResponse>>> list() {
        var result = examPermissionRepository.findAllByOrderByIdDesc()
            .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(result, "Exam permissions fetched"));
    }

    /** Danh sách permissions theo bài thi — ADMIN/TEACHER */
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/by-exam/{examId}")
    public ResponseEntity<ApiResponse<List<ExamPermissionResponse>>> listByExam(
            @PathVariable String examId) {
        Exam exam = resolveExam(examId);
        var result = examPermissionRepository.findByExamOrderByStudentAsc(exam)
            .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(result, "Exam permissions fetched"));
    }

    /** Permissions của một học sinh — STUDENT/PARENT/ADMIN */
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/by-student/{studentCode}")
    public ResponseEntity<ApiResponse<List<ExamPermissionResponse>>> listByStudent(
            @PathVariable String studentCode) {
        Student student = resolveStudent(studentCode);
        var result = examPermissionRepository.findByStudentOrderByIdDesc(student)
            .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(result, "Student exam permissions fetched"));
    }

    /** Tạo hoặc cập nhật permission — ADMIN */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<ExamPermissionResponse>> upsert(
            @Valid @RequestBody ExamPermissionUpsertRequest request) {
        Exam exam = resolveExam(request.getExamId());
        Student student = resolveStudent(request.getStudentCode());
        User approvedBy = getCurrentUser();

        ExamPermission permission = examPermissionRepository
            .findByExamAndStudent(exam, student)
            .orElse(ExamPermission.builder().exam(exam).student(student).build());

        permission.setIsAllowed(request.getIsAllowed());
        permission.setReason(request.getReason() != null ? request.getReason().trim() : null);
        permission.setApprovedBy(approvedBy);

        ExamPermission saved = examPermissionRepository.save(permission);
        log.info("Exam permission upserted: exam={} student={} allowed={}",
            exam.getId(), student.getStudentCode(), request.getIsAllowed());

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(toResponse(saved), "Exam permission saved"));
    }

    /** Xóa permission — ADMIN */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        UUID uuid = parseUuid(id);
        ExamPermission permission = examPermissionRepository.findById(uuid)
            .orElseThrow(() -> new CustomException("Exam permission not found", 404));
        examPermissionRepository.delete(permission);
        return ResponseEntity.ok(ApiResponse.success(null, "Exam permission deleted"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Exam resolveExam(String examId) {
        return examRepository.findByIdAndDeletedAtIsNull(parseUuid(examId))
            .orElseThrow(() -> new CustomException("Exam not found", 404));
    }

    private Student resolveStudent(String studentCode) {
        return studentRepository.findByStudentCodeAndDeletedAtIsNull(
                studentCode.trim().toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Student not found", 404));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new CustomException("User not found", 404));
    }

    private UUID parseUuid(String value) {
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            throw new CustomException("Invalid ID format", 400);
        }
    }

    private ExamPermissionResponse toResponse(ExamPermission p) {
        return ExamPermissionResponse.builder()
            .id(p.getId() != null ? p.getId().toString() : null)
            .examId(p.getExam() != null ? p.getExam().getId().toString() : null)
            .examTitle(p.getExam() != null ? p.getExam().getTitle() : null)
            .subjectName(p.getExam() != null && p.getExam().getSubject() != null
                ? p.getExam().getSubject().getName() : null)
            .examDate(p.getExam() != null && p.getExam().getExamDate() != null
                ? p.getExam().getExamDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : null)
            .studentCode(p.getStudent() != null ? p.getStudent().getStudentCode() : null)
            .studentName(p.getStudent() != null && p.getStudent().getUser() != null
                ? p.getStudent().getUser().getFullName() : null)
            .isAllowed(p.getIsAllowed())
            .reason(p.getReason())
            .approvedByEmail(p.getApprovedBy() != null ? p.getApprovedBy().getEmail() : null)
            .approvedByName(p.getApprovedBy() != null ? p.getApprovedBy().getFullName() : null)
            .build();
    }
}
