package com.school.school_management.service.score;

import com.school.school_management.dto.score.ScoreImportPreviewResponse;
import com.school.school_management.entity.Exam;
import com.school.school_management.entity.ExamClass;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Score;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.ExamClassRepository;
import com.school.school_management.repository.ExamRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.ScoreRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.SubjectRepository;
import java.io.InputStream;
import java.math.BigDecimal;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class ScoreImportServiceImpl implements ScoreImportService {

    private static final int DATA_START_ROW = 6;

    private final ScoreRepository scoreRepository;
    private final ExamRepository examRepository;
    private final ExamClassRepository examClassRepository;
    private final StudentRepository studentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final StudentClassRepository studentClassRepository;
    private final SubjectRepository subjectRepository;

    public ScoreImportServiceImpl(
            ScoreRepository scoreRepository,
            ExamRepository examRepository,
            ExamClassRepository examClassRepository,
            StudentRepository studentRepository,
            SchoolClassRepository schoolClassRepository,
            StudentClassRepository studentClassRepository,
            SubjectRepository subjectRepository) {
        this.scoreRepository = scoreRepository;
        this.examRepository = examRepository;
        this.examClassRepository = examClassRepository;
        this.studentRepository = studentRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.studentClassRepository = studentClassRepository;
        this.subjectRepository = subjectRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ScoreImportPreviewResponse previewImport(MultipartFile file) {
        return parseWorkbook(file);
    }

    @Override
    public ScoreImportPreviewResponse processImport(MultipartFile file) {
        ScoreImportPreviewResponse response = parseWorkbook(file);
        for (ScoreImportPreviewResponse.ScoreImportPreviewItem row : response.getRows()) {
            if (Boolean.TRUE.equals(row.getHasErrors())) {
                continue;
            }

            Exam exam = resolveExam(row.getExamTitle(), row.getClassCode(), row.getSubjectCode());
            Student student = studentRepository.findByStudentCodeAndDeletedAtIsNull(normalize(row.getStudentCode()))
                .orElseThrow(() -> new CustomException("Student not found", 404));
            Score score = scoreRepository.findByStudentAndExamAndDeletedAtIsNull(student, exam)
                .orElseThrow(() -> new CustomException("Score bootstrap not found", 404));

            if (!isEditable(score)) {
                throw new CustomException("Score is locked or outside edit window", 409);
            }

            BigDecimal nextValue = Boolean.TRUE.equals(row.getAbsentFlag())
                ? BigDecimal.ZERO
                : row.getScoreValue();

            score.setScoreValue(nextValue);
            score.setAbsentFlag(Boolean.TRUE.equals(row.getAbsentFlag()));
            if (score.getStatus() == null || (!"PUBLISHED".equalsIgnoreCase(score.getStatus()) && !"LOCKED".equalsIgnoreCase(score.getStatus()))) {
                score.setStatus("DRAFT");
            }
            scoreRepository.save(score);
        }

        return response;
    }

    private ScoreImportPreviewResponse parseWorkbook(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("Import file is required", 400);
        }

        List<ScoreImportPreviewResponse.ScoreImportPreviewItem> rows = new ArrayList<>();
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

                ScoreImportPreviewResponse.ScoreImportPreviewItem item = parseRow(rowIndex + 1, row, formatter);
                rows.add(item);
                if (Boolean.TRUE.equals(item.getHasErrors())) {
                    issues.addAll(item.getErrors().stream().map(error -> "Row " + item.getRowNumber() + ": " + error).toList());
                }
            }
        } catch (Exception exception) {
            throw new CustomException("Failed to parse score import file: " + exception.getMessage(), 400);
        }

        long valid = rows.stream().filter(item -> !Boolean.TRUE.equals(item.getHasErrors())).count();
        return ScoreImportPreviewResponse.builder()
            .importId(UUID.randomUUID())
            .totalRecords(rows.size())
            .validRecords((int) valid)
            .invalidRecords(rows.size() - (int) valid)
            .rows(rows)
            .issues(issues)
            .build();
    }

    private ScoreImportPreviewResponse.ScoreImportPreviewItem parseRow(int rowNumber, Row row, DataFormatter formatter) {
        List<String> errors = new ArrayList<>();

        String examTitle = normalize(readCell(row, 1, formatter));
        String classCode = normalize(readCell(row, 2, formatter));
        String studentCode = normalize(readCell(row, 3, formatter));
        String subjectCode = normalize(readCell(row, 4, formatter));
        String scoreText = normalize(readCell(row, 5, formatter));
        String note = normalize(readCell(row, 6, formatter));
        String absentText = normalize(readCell(row, 7, formatter));

        if (examTitle.isEmpty()) {
            errors.add("Exam title is required");
        }
        if (classCode.isEmpty()) {
            errors.add("Class code is required");
        }
        if (studentCode.isEmpty()) {
            errors.add("Student code is required");
        }
        if (subjectCode.isEmpty()) {
            errors.add("Subject code is required");
        }

        boolean absentFlag = isTruthy(absentText);
        BigDecimal scoreValue = null;
        if (absentFlag) {
            scoreValue = BigDecimal.ZERO;
        } else if (scoreText.isEmpty()) {
            errors.add("Score value is required when absent flag is not set");
        } else {
            try {
                scoreValue = new BigDecimal(scoreText.replace(',', '.'));
                if (scoreValue.compareTo(BigDecimal.ZERO) < 0 || scoreValue.compareTo(BigDecimal.TEN) > 0) {
                    errors.add("Score must be between 0 and 10");
                }
            } catch (NumberFormatException exception) {
                errors.add("Score value is invalid");
            }
        }

        if (errors.isEmpty()) {
            Exam resolvedExam = resolveExam(examTitle, classCode, subjectCode);
            if (resolvedExam == null) {
                errors.add("Exam not found for the given title, class and subject");
            }

            Student resolvedStudent = studentRepository.findByStudentCodeAndDeletedAtIsNull(studentCode).orElse(null);
            if (resolvedStudent == null) {
                errors.add("Student not found");
            }

            SchoolClass resolvedClass = schoolClassRepository.findByClassCodeAndDeletedAtIsNull(classCode).orElse(null);
            if (resolvedClass == null) {
                errors.add("Class not found");
            }

            if (resolvedStudent != null && resolvedClass != null) {
                boolean studentInClass = studentClassRepository.findBySchoolClassAndEndDateIsNull(resolvedClass).stream()
                    .map(StudentClass::getStudent)
                    .filter(item -> item != null && item.getDeletedAt() == null)
                    .anyMatch(item -> item.getStudentCode() != null && item.getStudentCode().equalsIgnoreCase(studentCode));
                if (!studentInClass) {
                    errors.add("Student is not currently enrolled in the selected class");
                }
            }

            if (resolvedExam != null && resolvedClass != null) {
                boolean examHasClass = examClassRepository.findByExam(resolvedExam).stream()
                    .map(ExamClass::getSchoolClass)
                    .filter(item -> item != null && item.getDeletedAt() == null)
                    .anyMatch(item -> item.getClassCode() != null && item.getClassCode().equalsIgnoreCase(classCode));
                if (!examHasClass) {
                    errors.add("Exam is not assigned to the selected class");
                }
            }

            if (!subjectRepository.existsByCodeAndDeletedAtIsNull(subjectCode)) {
                errors.add("Subject not found");
            }

            if (resolvedExam != null && resolvedStudent != null) {
                Score existingScore = scoreRepository.findByStudentAndExamAndDeletedAtIsNull(resolvedStudent, resolvedExam).orElse(null);
                if (existingScore == null) {
                    errors.add("Score bootstrap not found for this student and exam");
                } else if (!isEditable(existingScore)) {
                    errors.add("Score is locked or outside edit window");
                }
            }
        }

        return ScoreImportPreviewResponse.ScoreImportPreviewItem.builder()
            .rowNumber(rowNumber)
            .examTitle(examTitle)
            .classCode(classCode)
            .studentCode(studentCode)
            .subjectCode(subjectCode)
            .scoreValue(scoreValue)
            .note(note)
            .absentFlag(absentFlag)
            .hasErrors(!errors.isEmpty())
            .errors(errors)
            .build();
    }

    private Exam resolveExam(String examTitle, String classCode, String subjectCode) {
        String normalizedTitle = normalize(examTitle);
        String normalizedClassCode = normalize(classCode);
        String normalizedSubjectCode = normalize(subjectCode);

        return examRepository.findAllByDeletedAtIsNullOrderByExamDateDesc().stream()
            .filter(exam -> exam.getTitle() != null && exam.getTitle().trim().equalsIgnoreCase(normalizedTitle))
            .filter(exam -> exam.getSubject() != null && exam.getSubject().getCode() != null && exam.getSubject().getCode().trim().equalsIgnoreCase(normalizedSubjectCode))
            .filter(exam -> examClassRepository.findByExam(exam).stream()
                .map(ExamClass::getSchoolClass)
                .filter(item -> item != null && item.getDeletedAt() == null)
                .anyMatch(item -> item.getClassCode() != null && item.getClassCode().trim().equalsIgnoreCase(normalizedClassCode)))
            .findFirst()
            .orElse(null);
    }

    private boolean isEditable(Score score) {
        if (score == null) {
            return false;
        }

        String status = score.getStatus();
        if (status != null && "LOCKED".equalsIgnoreCase(status)) {
            return false;
        }

        if (status != null && "PUBLISHED".equalsIgnoreCase(status) && score.getExam() != null && score.getExam().getEditWindowDays() != null && score.getExam().getEditWindowDays() >= 0 && score.getPublishedAt() != null) {
            return !OffsetDateTime.now().isAfter(score.getPublishedAt().plusDays(score.getExam().getEditWindowDays()));
        }

        return true;
    }

    private boolean isTruthy(String value) {
        return "yes".equalsIgnoreCase(value) || "true".equalsIgnoreCase(value) || "1".equalsIgnoreCase(value);
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