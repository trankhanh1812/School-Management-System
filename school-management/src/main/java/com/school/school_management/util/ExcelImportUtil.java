package com.school.school_management.util;

import com.school.school_management.dto.student.BulkImportRequest;
import com.school.school_management.dto.student.ImportErrorRecord;
import com.school.school_management.dto.student.ParentImportRequest;
import com.school.school_management.dto.student.StudentImportRequest;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.core.io.ClassPathResource;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
public class ExcelImportUtil {

    private static final String STUDENT_SHEET = "STUDENT";
    private static final String PARENT_SHEET = "parent";
    private static final String INSTRUCTION_SHEET = "Instruction";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    public ByteArrayInputStream generateTemplate() {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            createStudentSheet(workbook);
            createParentSheet(workbook);
            createInstructionSheet(workbook);
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate import template", e);
        }
    }

    public BulkImportRequest parseExcelFile(InputStream inputStream) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(inputStream)) {
            BulkImportRequest request = new BulkImportRequest();
            XSSFSheet student = workbook.getSheet(STUDENT_SHEET);
            XSSFSheet parent = workbook.getSheet(PARENT_SHEET);
            request.setStudents(student == null ? new ArrayList<>() : parseStudentSheet(student));
            request.setParents(parent == null ? new ArrayList<>() : parseParentSheet(parent));
            return request;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse excel", e);
        }
    }

    public ByteArrayInputStream generateErrorReport(List<ImportErrorRecord> errors) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XSSFSheet sheet = workbook.createSheet("Import Errors");
            String[] headers = {"row", "student_code", "field", "error"};
            var header = sheet.createRow(0);
            CellStyle style = createHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell c = header.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(style);
            }
            for (int i = 0; i < errors.size(); i++) {
                ImportErrorRecord err = errors.get(i);
                var row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(err.getRow() == null ? "" : String.valueOf(err.getRow()));
                row.createCell(1).setCellValue(err.getStudentCode() == null ? "" : err.getStudentCode());
                row.createCell(2).setCellValue(err.getField() == null ? "" : err.getField());
                row.createCell(3).setCellValue(err.getError() == null ? "" : err.getError());
            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate error report", e);
        }
    }

    public List<ImportErrorRecord> validateStudentData(StudentImportRequest s) {
        List<ImportErrorRecord> errors = new ArrayList<>();
        if (isBlank(s.getFullName())) {
            errors.add(error(s, "full_name", "full_name is required"));
        }
        if (isBlank(s.getDateOfBirth()) || !isValidDate(s.getDateOfBirth())) {
            errors.add(error(s, "date_of_birth", "date_of_birth must be yyyy-MM-dd"));
        }
        if (isBlank(s.getGender()) || !("male".equalsIgnoreCase(s.getGender()) || "female".equalsIgnoreCase(s.getGender()))) {
            errors.add(error(s, "gender", "gender must be Male or Female"));
        }
        if (isBlank(s.getClassName())) {
            errors.add(error(s, "class_name", "class_name is required"));
        }
        if (isBlank(s.getAcademicYear())) {
            errors.add(error(s, "academic_year", "academic_year is required"));
        }
        if (!isBlank(s.getEmail()) && !EMAIL_PATTERN.matcher(s.getEmail()).matches()) {
            errors.add(error(s, "email", "invalid email"));
        }
        if (!isBlank(s.getEnrollmentDate()) && !isValidDate(s.getEnrollmentDate())) {
            errors.add(error(s, "enrollment_date", "enrollment_date must be yyyy-MM-dd"));
        }
        if (!isBlank(s.getStatus())) {
            String v = s.getStatus().trim().toLowerCase();
            if (!("studying".equals(v) || "transferred".equals(v) || "dropout".equals(v))) {
                errors.add(error(s, "status", "status must be studying/transferred/dropout"));
            }
        }
        if (!isBlank(s.getNationalId()) && (s.getNationalId().length() < 9 || s.getNationalId().length() > 12 || !s.getNationalId().matches("\\d+"))) {
            errors.add(error(s, "national_id", "national_id must be 9-12 digits"));
        }
        return errors;
    }

    public List<ImportErrorRecord> validateParentData(ParentImportRequest p) {
        List<ImportErrorRecord> errors = new ArrayList<>();
        if (isBlank(p.getStudentCode())) {
            errors.add(error(p.getRowNumber(), null, "student_code", "student_code is required"));
        }
        if (isBlank(p.getParentName())) {
            errors.add(error(p.getRowNumber(), p.getStudentCode(), "parent_name", "parent_name is required"));
        }
        if (isBlank(p.getParentPhone())) {
            errors.add(error(p.getRowNumber(), p.getStudentCode(), "parent_phone", "parent_phone is required"));
        }
        if (isBlank(p.getRelation())) {
            errors.add(error(p.getRowNumber(), p.getStudentCode(), "relation", "relation is required"));
        } else {
            String relation = p.getRelation().trim().toLowerCase();
            if (!("father".equals(relation) || "mother".equals(relation) || "guardian".equals(relation))) {
                errors.add(error(p.getRowNumber(), p.getStudentCode(), "relation", "relation must be father/mother/guardian"));
            }
        }
        if (!isBlank(p.getParentEmail()) && !EMAIL_PATTERN.matcher(p.getParentEmail()).matches()) {
            errors.add(error(p.getRowNumber(), p.getStudentCode(), "parent_email", "invalid parent_email"));
        }
        if (!isBlank(p.getIsPrimary())) {
            String isPrimary = p.getIsPrimary().trim().toLowerCase();
            if (!("true".equals(isPrimary) || "false".equals(isPrimary))) {
                errors.add(error(p.getRowNumber(), p.getStudentCode(), "is_primary", "is_primary must be true or false"));
            }
        }
        return errors;
    }

    private void createStudentSheet(XSSFWorkbook workbook) {
        XSSFSheet sheet = workbook.createSheet(STUDENT_SHEET);
        String[] headers = {"student_code", "full_name", "date_of_birth", "gender", "phone", "email", "address", "class_name", "academic_year", "status", "enrollment_date", "national_id"};
        var row = sheet.createRow(0);
        CellStyle style = createHeaderStyle(workbook);
        for (int i = 0; i < headers.length; i++) {
            Cell c = row.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(style);
            sheet.setColumnWidth(i, 5000);
        }
        addDropdownValidation(sheet, 1, 3000, 3, new String[]{"Male", "Female"});
        addDropdownValidation(sheet, 1, 3000, 9, new String[]{"studying", "transferred", "dropout"});
    }

    private void createParentSheet(XSSFWorkbook workbook) {
        XSSFSheet sheet = workbook.createSheet(PARENT_SHEET);
        String[] headers = {"student_code", "parent_name", "parent_phone", "parent_email", "relation", "is_primary"};
        var row = sheet.createRow(0);
        CellStyle style = createHeaderStyle(workbook);
        for (int i = 0; i < headers.length; i++) {
            Cell c = row.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(style);
            sheet.setColumnWidth(i, 5000);
        }
        addDropdownValidation(sheet, 1, 3000, 4, new String[]{"father", "mother", "guardian"});
        addDropdownValidation(sheet, 1, 3000, 5, new String[]{"true", "false"});
    }

    private void createInstructionSheet(XSSFWorkbook workbook) {
        XSSFSheet sheet = workbook.createSheet(INSTRUCTION_SHEET);
        String[] lines = {
            "1. Do not rename columns",
            "2. Date format must be YYYY-MM-DD",
            "3. Gender must be Male/Female",
            "4. Academic Year example: 2024-2025",
            "5. Class must exist in system",
            "6. Use class_name + academic_year mapping",
            "7. Do not input id or uuid",
            "8. National_id (CCCD) must be 9-12 digits, optional but recommended for login"
        };
        for (int i = 0; i < lines.length; i++) {
            var row = sheet.createRow(i);
            row.createCell(0).setCellValue(lines[i]);
        }
        sheet.setColumnWidth(0, 20000);
    }

    private List<StudentImportRequest> parseStudentSheet(XSSFSheet sheet) {
        List<StudentImportRequest> result = new ArrayList<>();
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            var row = sheet.getRow(i);
            if (row == null || isRowEmpty(row, 12)) {
                continue;
            }
            result.add(StudentImportRequest.builder()
                .studentCode(getCellValue(row, 0))
                .fullName(getCellValue(row, 1))
                .dateOfBirth(getCellValue(row, 2))
                .gender(getCellValue(row, 3))
                .phone(getCellValue(row, 4))
                .email(getCellValue(row, 5))
                .address(getCellValue(row, 6))
                .className(getCellValue(row, 7))
                .academicYear(getCellValue(row, 8))
                .status(getCellValue(row, 9))
                .enrollmentDate(getCellValue(row, 10))
                .nationalId(getCellValue(row, 11))
                .rowNumber(i + 1)
                .build());
        }
        return result;
    }

    private List<ParentImportRequest> parseParentSheet(XSSFSheet sheet) {
        List<ParentImportRequest> result = new ArrayList<>();
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            var row = sheet.getRow(i);
            if (row == null || isRowEmpty(row, 6)) {
                continue;
            }
            result.add(ParentImportRequest.builder()
                .studentCode(getCellValue(row, 0))
                .parentName(getCellValue(row, 1))
                .parentPhone(getCellValue(row, 2))
                .parentEmail(getCellValue(row, 3))
                .relation(getCellValue(row, 4))
                .isPrimary(getCellValue(row, 5))
                .rowNumber(i + 1)
                .build());
        }
        return result;
    }

    private void addDropdownValidation(XSSFSheet sheet, int firstRow, int lastRow, int col, String[] values) {
        DataValidationConstraint constraint = sheet.getDataValidationHelper().createExplicitListConstraint(values);
        CellRangeAddressList range = new CellRangeAddressList(firstRow, lastRow, col, col);
        DataValidation validation = sheet.getDataValidationHelper().createValidation(constraint, range);
        validation.setShowErrorBox(true);
        sheet.addValidationData(validation);
    }

    private String getCellValue(org.apache.poi.ss.usermodel.Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
            LocalDate date = cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            return date.format(DATE_FORMATTER);
        }
        String value = new DataFormatter().formatCellValue(cell);
        return value == null ? null : value.trim();
    }

    private boolean isRowEmpty(org.apache.poi.ss.usermodel.Row row, int maxColumns) {
        for (int i = 0; i < maxColumns; i++) {
            if (!isBlank(getCellValue(row, i))) {
                return false;
            }
        }
        return true;
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor((short) 22);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private ImportErrorRecord error(StudentImportRequest s, String field, String message) {
        return error(s.getRowNumber(), s.getStudentCode(), field, message);
    }

    private ImportErrorRecord error(Integer row, String studentCode, String field, String message) {
        return ImportErrorRecord.builder().row(row).studentCode(studentCode).field(field).error(message).build();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean isValidDate(String value) {
        try {
            LocalDate.parse(value, DATE_FORMATTER);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
