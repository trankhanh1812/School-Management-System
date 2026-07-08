package com.school.school_management.service.classroom;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.school.school_management.dto.classroom.PromotionImportPreviewResponse;
import com.school.school_management.entity.AcademicYear;
import com.school.school_management.entity.PromotionLog;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.AcademicYearRepository;
import com.school.school_management.repository.PromotionLogRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.UserRepository;

@Service
@Transactional
public class PromotionImportServiceImpl implements PromotionImportService {

    private static final int DATA_START_ROW = 6;

    private final PromotionLogRepository promotionLogRepository;
    private final StudentRepository studentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final StudentClassRepository studentClassRepository;
    private final AcademicYearRepository academicYearRepository;
    private final UserRepository userRepository;

    public PromotionImportServiceImpl(
            PromotionLogRepository promotionLogRepository,
            StudentRepository studentRepository,
            SchoolClassRepository schoolClassRepository,
            StudentClassRepository studentClassRepository,
            AcademicYearRepository academicYearRepository,
            UserRepository userRepository) {
        this.promotionLogRepository = promotionLogRepository;
        this.studentRepository = studentRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.studentClassRepository = studentClassRepository;
        this.academicYearRepository = academicYearRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionImportPreviewResponse previewImport(MultipartFile file) {
        return parseWorkbook(file);
    }

    @Override
    public PromotionImportPreviewResponse processImport(MultipartFile file) {
        PromotionImportPreviewResponse response = parseWorkbook(file);
        User currentUser = getCurrentUser();

        for (PromotionImportPreviewResponse.PromotionImportPreviewItem row : response.getRows()) {
            if (Boolean.TRUE.equals(row.getHasErrors())) {
                continue;
            }

            Student student = studentRepository.findByStudentCodeAndDeletedAtIsNull(normalize(row.getStudentCode()))
                .orElseThrow(() -> new CustomException("Student not found", 404));
            StudentClass activeMapping = studentClassRepository.findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student).orElse(null);
            SchoolClass fromClass = activeMapping != null ? activeMapping.getSchoolClass() : null;
            AcademicYear fromAcademicYear = activeMapping != null ? activeMapping.getAcademicYear() : null;
            SchoolClass toClass = row.getProposedClass() == null || row.getProposedClass().isBlank()
                ? null
                : schoolClassRepository.findByClassCodeAndDeletedAtIsNull(normalize(row.getProposedClass())).orElse(null);
            AcademicYear toAcademicYear = academicYearRepository.findByCode(normalize(row.getNextAcademicYear())).orElse(null);

            String action = normalizeAction(row.getAction());
            boolean isDropout = "dropout".equalsIgnoreCase(action);

            // Idempotency: if the student already has a class mapping in the target year,
            // this promotion was already applied — skip to avoid duplicate rows / constraint
            // violation on the unique (student_id, academic_year_id) index.
            if (toAcademicYear != null
                    && studentClassRepository.findByStudentAndAcademicYear(student, toAcademicYear).isPresent()) {
                continue;
            }

            // 1) Close the current active class mapping (the student finished that year).
            if (activeMapping != null) {
                activeMapping.setEndDate(LocalDate.now());
                activeMapping.setStatus(isDropout ? "DROPPED" : "COMPLETED");
                studentClassRepository.save(activeMapping);
            }

            // 2) Enrol the student into the next class/year (promote or repeat). Dropouts leave.
            if (!isDropout && toClass != null && toAcademicYear != null) {
                studentClassRepository.save(StudentClass.builder()
                    .student(student)
                    .schoolClass(toClass)
                    .academicYear(toAcademicYear)
                    .startDate(LocalDate.now())
                    .status("ACTIVE")
                    .transferReason("Xét lên lớp (" + action + ")")
                    .build());
            }

            // 3) Record the promotion history.
            promotionLogRepository.save(PromotionLog.builder()
                .student(student)
                .fromClass(fromClass)
                .toClass(toClass)
                .fromAcademicYear(fromAcademicYear)
                .toAcademicYear(toAcademicYear)
                .promotionResult(action.toUpperCase(Locale.ROOT))
                .promotedBy(currentUser.getId())
                .promotedAt(OffsetDateTime.now())
                .build());
        }

        return response;
    }

    private PromotionImportPreviewResponse parseWorkbook(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("Import file is required", 400);
        }

        List<PromotionImportPreviewResponse.PromotionImportPreviewItem> rows = new ArrayList<>();
        List<String> issues = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream(); Workbook workbook = WorkbookFactory.create(inputStream)) {
            if (workbook.getNumberOfSheets() < 2) {
                throw new CustomException("Template must contain a data sheet", 400);
            }

            Sheet sheet = workbook.getSheetAt(1);
            DataFormatter formatter = new DataFormatter(Locale.getDefault());

            for (int rowIndex = DATA_START_ROW; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankDataRow(row, formatter, 1, 7)) {
                    continue;
                }

                PromotionImportPreviewResponse.PromotionImportPreviewItem item = parseRow(rowIndex + 1, row, formatter);
                rows.add(item);
                if (Boolean.TRUE.equals(item.getHasErrors())) {
                    issues.addAll(item.getErrors().stream().map(error -> "Row " + item.getRowNumber() + ": " + error).toList());
                }
            }
        } catch (Exception exception) {
            throw new CustomException("Failed to parse promotion import file: " + exception.getMessage(), 400);
        }

        long valid = rows.stream().filter(item -> !Boolean.TRUE.equals(item.getHasErrors())).count();
        return PromotionImportPreviewResponse.builder()
            .importId(UUID.randomUUID())
            .totalRecords(rows.size())
            .validRecords((int) valid)
            .invalidRecords(rows.size() - (int) valid)
            .rows(rows)
            .issues(issues)
            .build();
    }

    private PromotionImportPreviewResponse.PromotionImportPreviewItem parseRow(int rowNumber, Row row, DataFormatter formatter) {
        List<String> errors = new ArrayList<>();

        String studentCode = normalize(readCell(row, 1, formatter));
        String currentClass = normalize(readCell(row, 2, formatter));
        String currentAcademicYear = normalize(readCell(row, 3, formatter));
        String proposedClass = normalize(readCell(row, 4, formatter));
        String nextAcademicYear = normalize(readCell(row, 5, formatter));
        String actionText = normalize(readCell(row, 6, formatter));
        String note = normalize(readCell(row, 7, formatter));

        if (studentCode.isEmpty()) {
            errors.add("Student code is required");
        }
        if (currentClass.isEmpty()) {
            errors.add("Current class is required");
        }
        if (currentAcademicYear.isEmpty()) {
            errors.add("Current academic year is required");
        }
        if (nextAcademicYear.isEmpty()) {
            errors.add("Next academic year is required");
        }

        String action = normalizeAction(actionText);
        if (action.isEmpty()) {
            errors.add("Action is required");
        }

        boolean isDropout = "dropout".equalsIgnoreCase(action);
        if (!isDropout && proposedClass.isEmpty()) {
            errors.add("Proposed class is required for promotion or repeat actions");
        }

        Student student = null;
        SchoolClass resolvedCurrentClass = null;
        AcademicYear resolvedCurrentYear = null;
        if (errors.isEmpty()) {
            student = studentRepository.findByStudentCodeAndDeletedAtIsNull(studentCode).orElse(null);
            if (student == null) {
                errors.add("Student not found");
            }

            resolvedCurrentClass = schoolClassRepository.findByClassCodeAndDeletedAtIsNull(currentClass).orElse(null);
            if (resolvedCurrentClass == null) {
                errors.add("Current class not found");
            }

            resolvedCurrentYear = academicYearRepository.findByCode(currentAcademicYear).orElse(null);
            if (resolvedCurrentYear == null) {
                errors.add("Current academic year not found");
            }

            if (student != null && resolvedCurrentClass != null && resolvedCurrentYear != null) {
                StudentClass activeMapping = studentClassRepository.findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student).orElse(null);
                if (activeMapping == null) {
                    errors.add("Student does not have an active class mapping");
                } else {
                    if (activeMapping.getSchoolClass() == null || activeMapping.getSchoolClass().getClassCode() == null || !activeMapping.getSchoolClass().getClassCode().equalsIgnoreCase(currentClass)) {
                        errors.add("Current class does not match the active student class");
                    }
                    if (activeMapping.getAcademicYear() == null || activeMapping.getAcademicYear().getCode() == null || !activeMapping.getAcademicYear().getCode().equalsIgnoreCase(currentAcademicYear)) {
                        errors.add("Current academic year does not match the active student class");
                    }
                }
            }

            if (!isDropout && schoolClassRepository.findByClassCodeAndDeletedAtIsNull(proposedClass).isEmpty()) {
                errors.add("Proposed class not found");
            }

            if (academicYearRepository.findByCode(nextAcademicYear).isEmpty()) {
                errors.add("Next academic year not found");
            }
        }

        return PromotionImportPreviewResponse.PromotionImportPreviewItem.builder()
            .rowNumber(rowNumber)
            .studentCode(studentCode)
            .studentName(student != null && student.getUser() != null && student.getUser().getFullName() != null ? student.getUser().getFullName() : "")
            .currentClass(currentClass)
            .currentAcademicYear(currentAcademicYear)
            .proposedClass(proposedClass)
            .nextAcademicYear(nextAcademicYear)
            .action(action)
            .note(note)
            .hasErrors(!errors.isEmpty())
            .errors(errors)
            .build();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication() != null
            ? SecurityContextHolder.getContext().getAuthentication().getName()
            : null;
        if (email == null || email.isBlank()) {
            throw new CustomException("Unauthenticated", 401);
        }

        return userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Current user not found", 404));
    }

    private String normalizeAction(String value) {
        String normalized = normalize(value).toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "promotion" -> "promote";
            case "repeat" -> "repeat";
            case "dropout" -> "dropout";
            default -> normalized;
        };
    }

    private String readCell(Row row, int index, DataFormatter formatter) {
        Cell cell = row.getCell(index, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) {
            return "";
        }
        CellType cellType = cell.getCellType();
        if (cellType == CellType.BLANK) {
            return "";
        }
        return formatter.formatCellValue(cell);
    }

    private boolean isBlankDataRow(Row row, DataFormatter formatter, int firstDataColumn, int lastDataColumn) {
        for (int index = firstDataColumn; index <= lastDataColumn; index++) {
            if (!normalize(readCell(row, index, formatter)).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}