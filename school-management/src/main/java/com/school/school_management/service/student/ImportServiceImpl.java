package com.school.school_management.service.student;

import com.school.school_management.dto.student.BulkImportRequest;
import com.school.school_management.dto.student.BulkImportResponse;
import com.school.school_management.dto.student.ImportErrorRecord;
import com.school.school_management.dto.student.ParentImportRequest;
import com.school.school_management.dto.student.StudentImportRequest;
import com.school.school_management.dto.student.StudentImportPreviewResponse;
import com.school.school_management.dto.student.StudentUpsertRequest;
import com.school.school_management.entity.ImportLog;
import com.school.school_management.entity.Parent;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.Role;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.User;
import com.school.school_management.entity.UserRole;
import com.school.school_management.repository.ImportLogRepository;
import com.school.school_management.repository.ParentRepository;
import com.school.school_management.repository.ParentStudentRepository;
import com.school.school_management.repository.RoleRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.util.ExcelImportUtil;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ImportServiceImpl implements ImportService {

    private final ExcelImportUtil excelImportUtil;
    private final StudentService studentService;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ParentRepository parentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlatformTransactionManager transactionManager;
    private final ImportLogRepository importLogRepository;

    private final Map<String, byte[]> errorReportStore = new HashMap<>();

    /** Người đang đăng nhập (để gán imported_by cho import_log); null nếu không xác định được. */
    private User resolveCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return null;
            }
            return userRepository.findByUsernameAndDeletedAtIsNull(auth.getName()).orElse(null);
        } catch (Exception ex) {
            return null;
        }
    }

    @Override
    public StudentImportPreviewResponse getImportPreview(MultipartFile file) {
        try {
            BulkImportRequest request = excelImportUtil.parseExcelFile(file.getInputStream());
            List<ImportErrorRecord> errors = new ArrayList<>();
            List<StudentImportPreviewResponse.StudentPreviewItem> studentPreviews = new ArrayList<>();
            List<StudentImportPreviewResponse.ParentPreviewItem> parentPreviews = new ArrayList<>();
            int validCount = 0;
            int invalidCount = 0;

            // Process students
            for (StudentImportRequest row : request.getStudents()) {
                List<ImportErrorRecord> rowErrors = excelImportUtil.validateStudentData(row);
                StudentImportPreviewResponse.StudentPreviewItem preview = StudentImportPreviewResponse.StudentPreviewItem.builder()
                    .rowNumber(row.getRowNumber())
                    .studentCode(row.getStudentCode())
                    .fullName(row.getFullName())
                    .dateOfBirth(row.getDateOfBirth())
                    .gender(row.getGender())
                    .phone(row.getPhone())
                    .email(row.getEmail())
                    .address(row.getAddress())
                    .className(row.getClassName())
                    .academicYear(row.getAcademicYear())
                    .status(row.getStatus())
                    .enrollmentDate(row.getEnrollmentDate())
                    .nationalId(row.getNationalId())
                    .hasErrors(!rowErrors.isEmpty())
                    .fieldErrors(new ArrayList<>())
                    .build();

                if (rowErrors.isEmpty()) {
                    validCount++;
                } else {
                    invalidCount++;
                    rowErrors.forEach(err -> preview.getFieldErrors().add(err.getField() + ": " + err.getError()));
                    errors.addAll(rowErrors);
                }

                studentPreviews.add(preview);
            }

            // Process parents
            for (ParentImportRequest row : request.getParents()) {
                List<ImportErrorRecord> rowErrors = excelImportUtil.validateParentData(row);
                StudentImportPreviewResponse.ParentPreviewItem preview = StudentImportPreviewResponse.ParentPreviewItem.builder()
                    .rowNumber(row.getRowNumber())
                    .studentCode(row.getStudentCode())
                    .parentName(row.getParentName())
                    .parentPhone(row.getParentPhone())
                    .parentEmail(row.getParentEmail())
                    .relation(row.getRelation())
                    .isPrimary(row.getIsPrimary())
                    .hasErrors(!rowErrors.isEmpty())
                    .fieldErrors(new ArrayList<>())
                    .build();

                if (rowErrors.isEmpty()) {
                    validCount++;
                } else {
                    invalidCount++;
                    rowErrors.forEach(err -> preview.getFieldErrors().add(err.getField() + ": " + err.getError()));
                    errors.addAll(rowErrors);
                }

                parentPreviews.add(preview);
            }

            String importId = UUID.randomUUID().toString();
            return StudentImportPreviewResponse.builder()
                .importId(importId)
                .totalRecords(request.getStudents().size() + request.getParents().size())
                .validRecords(validCount)
                .invalidRecords(invalidCount)
                .students(studentPreviews)
                .parents(parentPreviews)
                .errors(errors)
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate import preview: " + e.getMessage(), e);
        }
    }

    @Override
    public BulkImportResponse processBulkImport(MultipartFile file) {
        try {
            BulkImportRequest request = excelImportUtil.parseExcelFile(file.getInputStream());
            List<ImportErrorRecord> errors = new ArrayList<>();
            int success = 0;
            Map<String, Student> importedStudents = new HashMap<>();

            // Each row runs in its OWN transaction (REQUIRES_NEW). A failed row rolls back
            // only itself, so valid rows still commit and the "skip bad rows + partial
            // success" design works. (Previously the whole batch shared one transaction,
            // so one bad row marked it rollback-only and discarded every row at commit.)
            TransactionTemplate rowTx = new TransactionTemplate(transactionManager);
            rowTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

            for (StudentImportRequest row : request.getStudents()) {
                List<ImportErrorRecord> rowErrors = excelImportUtil.validateStudentData(row);
                if (!rowErrors.isEmpty()) {
                    errors.addAll(rowErrors);
                    continue;
                }

                try {
                    String studentCode = normalizeCode(row.getStudentCode());
                    if (studentCode == null) {
                        studentCode = generateStudentCode();
                    }
                    final String resolvedCode = studentCode;

                    StudentUpsertRequest upsert = StudentUpsertRequest.builder()
                        .studentCode(studentCode)
                        .fullName(row.getFullName())
                        .dateOfBirth(row.getDateOfBirth())
                        .gender(row.getGender())
                        .phone(row.getPhone())
                        .email(row.getEmail())
                        .address(row.getAddress())
                        .className(row.getClassName())
                        .academicYear(row.getAcademicYear())
                        .status(row.getStatus())
                        .nationalId(row.getNationalId())
                        .enrollmentDate(row.getEnrollmentDate())
                        .build();

                    Student student = rowTx.execute(status -> {
                        studentService.createStudent(upsert);
                        return studentRepository.findByStudentCodeAndDeletedAtIsNull(resolvedCode).orElse(null);
                    });
                    if (student != null) {
                        importedStudents.put(studentCode, student);
                    }
                    success++;
                } catch (Exception ex) {
                    errors.add(ImportErrorRecord.builder()
                        .row(row.getRowNumber())
                        .studentCode(row.getStudentCode())
                        .field("general")
                        .error(rootMessage(ex))
                        .build());
                }
            }

            for (ParentImportRequest row : request.getParents()) {
                List<ImportErrorRecord> rowErrors = excelImportUtil.validateParentData(row);
                if (!rowErrors.isEmpty()) {
                    errors.addAll(rowErrors);
                    continue;
                }

                String studentCode = normalizeCode(row.getStudentCode());
                Student student = importedStudents.get(studentCode);
                if (student == null) {
                    student = studentRepository.findByStudentCodeAndDeletedAtIsNull(studentCode).orElse(null);
                }
                if (student == null) {
                    errors.add(ImportErrorRecord.builder()
                        .row(row.getRowNumber())
                        .studentCode(row.getStudentCode())
                        .field("student_code")
                        .error("Student not found")
                        .build());
                    continue;
                }

                try {
                    final Student linkedStudent = student;
                    rowTx.executeWithoutResult(status -> createParentAndLink(linkedStudent, row));
                } catch (Exception ex) {
                    errors.add(ImportErrorRecord.builder()
                        .row(row.getRowNumber())
                        .studentCode(row.getStudentCode())
                        .field("general")
                        .error(rootMessage(ex))
                        .build());
                }
            }

            UUID importId = UUID.randomUUID();
            if (!errors.isEmpty()) {
                byte[] report = excelImportUtil.generateErrorReport(errors).readAllBytes();
                errorReportStore.put(importId.toString(), report);
            }

            int totalRows = request.getStudents().size() + request.getParents().size();
            int failedRows = (int) errors.stream().map(ImportErrorRecord::getRow).filter(r -> r != null).distinct().count();

            // Lưu lịch sử import vào DB (import_log) để màn hình quản trị đọc được;
            // trước đây chỉ giữ báo cáo lỗi trong RAM nên restart là mất.
            try {
                importLogRepository.save(ImportLog.builder()
                    .importType("STUDENT")
                    .fileName(file.getOriginalFilename())
                    .totalRows(totalRows)
                    .successRows(success)
                    .failedRows(failedRows)
                    .importedBy(resolveCurrentUser())
                    .importedAt(OffsetDateTime.now())
                    .build());
            } catch (Exception logEx) {
                // Không để việc ghi log chặn kết quả import
            }

            return BulkImportResponse.builder()
                .importId(importId)
                .totalRecords(totalRows)
                .successfulRecords(success)
                .failedRecords(failedRows)
                .errors(errors)
                .message("Import completed")
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to import excel", e);
        }
    }

    @Override
    public byte[] getErrorReport(String importId) {
        byte[] data = errorReportStore.get(importId);
        if (data == null) {
            throw new RuntimeException("Error report not found");
        }
        return data;
    }

    /** Deepest cause message — the per-row transaction may wrap the original exception. */
    private String rootMessage(Throwable ex) {
        Throwable cause = ex;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : ex.getMessage();
    }

    private void createParentAndLink(Student student, ParentImportRequest row) {
        String phone = row.getParentPhone() != null ? row.getParentPhone().trim() : null;
        String email = isBlank(row.getParentEmail()) ? buildSyntheticEmail(phone != null ? phone : generateParentCode()) : row.getParentEmail().trim().toLowerCase();

        // Check if a user with this phone (username) already exists — reuse if so
        User existingUser = isBlank(phone) ? null : userRepository.findByUsername(phone).orElse(null);
        User savedUser;
        if (existingUser != null) {
            savedUser = existingUser;
        } else {
            String username = !isBlank(phone) ? phone : generateParentCode();
            // Initial password = phone; forcePasswordChange = true so parent must change on first login
            User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(!isBlank(phone) ? phone : username))
                .fullName(row.getParentName())
                .status("ACTIVE")
                .forcePasswordChange(true)
                .build();

            Role parentRole = roleRepository.findByCode("PARENT").orElseThrow(() -> new RuntimeException("PARENT role missing"));
            user.getUserRoles().add(UserRole.builder().user(user).role(parentRole).build());
            savedUser = userRepository.save(user);
        }

        // Check if parent profile already exists for this user
        Parent parent = parentRepository.findByUser(savedUser).orElseGet(() -> {
            Parent newParent = Parent.builder()
                .user(savedUser)
                .parentCode(generateParentCode())
                .fullName(row.getParentName())
                .phone(phone)
                .build();
            return parentRepository.save(newParent);
        });

        // Respect the explicit "Là PH chính" (is_primary) column when provided;
        // otherwise fall back to inferring from the relation (father/mother => primary).
        boolean isPrimary;
        if (!isBlank(row.getIsPrimary())) {
            isPrimary = "true".equalsIgnoreCase(row.getIsPrimary().trim());
        } else {
            isPrimary = "father".equalsIgnoreCase(row.getRelation()) || "mother".equalsIgnoreCase(row.getRelation());
        }
        Optional<ParentStudent> existing = parentStudentRepository.findByParentAndStudent(parent, student);
        if (existing.isEmpty()) {
            ParentStudent relation = ParentStudent.builder()
                .parent(parent)
                .student(student)
                .isPrimaryContact(isPrimary)
                .canViewScore(true)
                .build();
            parentStudentRepository.save(relation);
        }
    }

    private String generateStudentCode() {
        long count = studentRepository.count() + 1;
        return String.format("STD%06d", count);
    }

    private String generateParentCode() {
        long count = parentRepository.count() + 1;
        return String.format("PAR%06d", count);
    }

    private String buildSyntheticEmail(String code) {
        return code.toLowerCase() + "@import.local";
    }

    private String normalizeCode(String v) {
        if (isBlank(v)) {
            return null;
        }
        return v.trim().toUpperCase();
    }

    private boolean isBlank(String v) {
        return v == null || v.trim().isEmpty();
    }
}
