package com.school.school_management.service.teaching;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.school.school_management.dto.teaching.TimetableGridUpsertRequest;
import com.school.school_management.dto.teaching.TimetableImportPreviewResponse;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TimetableImportServiceImpl implements TimetableImportService {

    private static final int METADATA_ROW_INDEX = 2; // row 3 (row 2 holds the labels)
    private static final int HEADER_ROW_INDEX = 4; // row 5
    private static final int DATA_START_ROW_INDEX = 5; // row 6
    private static final int CLASS_START_COLUMN_INDEX = 2; // column C
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final TeachingService teachingService;

    @Override
    public TimetableImportPreviewResponse previewImport(MultipartFile file) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(file.getInputStream())) {
            XSSFSheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            String versionName = normalize(getCellValue(sheet, METADATA_ROW_INDEX, 0, formatter));
            String academicYearCode = normalize(getCellValue(sheet, METADATA_ROW_INDEX, 1, formatter));
            String semesterRaw = normalize(getCellValue(sheet, METADATA_ROW_INDEX, 2, formatter));
            String semesterCode = normalizeSemester(semesterRaw);
            String effectiveFrom = normalizeDate(getCellValue(sheet, METADATA_ROW_INDEX, 3, formatter));
            String effectiveTo = normalizeDate(getCellValue(sheet, METADATA_ROW_INDEX, 4, formatter));

            Map<Integer, String> classCodeByColumn = extractClassColumns(sheet, formatter);

            List<TimetableGridUpsertRequest.TimetableEntry> entries = new ArrayList<>();
            List<TimetableImportPreviewResponse.ImportIssue> issues = new ArrayList<>();
            int totalDetected = 0;

            Short currentDay = null;
            for (int rowIndex = DATA_START_ROW_INDEX; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                String dayText = normalize(getCellValue(sheet, rowIndex, 0, formatter));
                if (!dayText.isEmpty()) {
                    currentDay = parseDayOfWeek(dayText);
                }

                String periodText = normalize(getCellValue(sheet, rowIndex, 1, formatter));
                Short period = parsePeriod(periodText);

                if (currentDay == null || period == null) {
                    continue;
                }

                for (Map.Entry<Integer, String> classEntry : classCodeByColumn.entrySet()) {
                    int columnIndex = classEntry.getKey();
                    String classCode = classEntry.getValue();
                    String subjectCode = normalize(getCellValue(sheet, rowIndex, columnIndex, formatter)).toUpperCase(Locale.ROOT);

                    if (subjectCode.isEmpty()) {
                        continue;
                    }

                    totalDetected++;
                    boolean valid = true;

                    if (!schoolClassRepository.existsByClassCodeAndDeletedAtIsNull(classCode)) {
                        valid = false;
                        issues.add(issue(rowIndex + 1, excelColumnName(columnIndex), classCode, subjectCode, "Class code not found in system"));
                    }

                    if (!subjectRepository.existsByCodeAndDeletedAtIsNull(subjectCode)) {
                        valid = false;
                        issues.add(issue(rowIndex + 1, excelColumnName(columnIndex), classCode, subjectCode, "Subject code not found in system"));
                    }

                    if (valid) {
                        TimetableGridUpsertRequest.TimetableEntry item = new TimetableGridUpsertRequest.TimetableEntry();
                        item.setClassCode(classCode);
                        item.setSubjectCode(subjectCode);
                        item.setDayOfWeek(currentDay);
                        item.setPeriodStart(period);
                        item.setPeriodEnd(period);
                        entries.add(item);
                    }
                }
            }

            return TimetableImportPreviewResponse.builder()
                .versionName(versionName)
                .academicYearCode(academicYearCode)
                .semesterCode(semesterCode)
                .effectiveFrom(effectiveFrom)
                .effectiveTo(effectiveTo)
                .totalDetectedCells(totalDetected)
                .validEntries(entries.size())
                .invalidEntries(totalDetected - entries.size())
                .entries(entries)
                .issues(issues)
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse timetable import file", e);
        }
    }

    @Override
    public TimetableImportPreviewResponse processImport(MultipartFile file) {
        TimetableImportPreviewResponse preview = previewImport(file);
        List<TimetableGridUpsertRequest.TimetableEntry> validEntries = preview.getEntries() == null
            ? List.of()
            : preview.getEntries();

        if (validEntries.isEmpty()) {
            throw new CustomException("No valid timetable entries to import", 400);
        }

        TimetableGridUpsertRequest request = new TimetableGridUpsertRequest();
        request.setAcademicYearCode(normalize(preview.getAcademicYearCode()));
        request.setSemesterCode(normalizeSemester(preview.getSemesterCode()));
        request.setVersionName(normalize(preview.getVersionName()).isEmpty() ? "TKB Import" : normalize(preview.getVersionName()));
        request.setEffectiveFrom(parseDateOrDefault(preview.getEffectiveFrom(), LocalDate.now()));
        request.setEffectiveTo(parseDateOrDefault(preview.getEffectiveTo(), request.getEffectiveFrom()));
        request.setStatus("LOCKED");
        request.setEntries(validEntries);

        teachingService.upsertTimetableGrid(request);
        return preview;
    }

    private Map<Integer, String> extractClassColumns(XSSFSheet sheet, DataFormatter formatter) {
        Map<Integer, String> columns = new HashMap<>();
        if (sheet.getRow(HEADER_ROW_INDEX) == null) {
            return columns;
        }

        short lastCol = sheet.getRow(HEADER_ROW_INDEX).getLastCellNum();
        for (int col = CLASS_START_COLUMN_INDEX; col < lastCol; col++) {
            String classCode = normalize(getCellValue(sheet, HEADER_ROW_INDEX, col, formatter)).toUpperCase(Locale.ROOT);
            if (!classCode.isEmpty()) {
                columns.put(col, classCode);
            }
        }
        return columns;
    }

    private TimetableImportPreviewResponse.ImportIssue issue(
        Integer row,
        String column,
        String classCode,
        String subjectCode,
        String message
    ) {
        return TimetableImportPreviewResponse.ImportIssue.builder()
            .row(row)
            .column(column)
            .classCode(classCode)
            .subjectCode(subjectCode)
            .message(message)
            .build();
    }

    private String getCellValue(XSSFSheet sheet, int rowIndex, int colIndex, DataFormatter formatter) {
        if (sheet.getRow(rowIndex) == null) {
            return "";
        }
        Cell cell = sheet.getRow(rowIndex).getCell(colIndex);
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeSemester(String raw) {
        if (raw == null) {
            return "";
        }
        String text = raw.trim().toUpperCase(Locale.ROOT);
        if ("1".equals(text) || "HK1".equals(text)) {
            return "HK1";
        }
        if ("2".equals(text) || "HK2".equals(text)) {
            return "HK2";
        }
        return text;
    }

    private String normalizeDate(String raw) {
        String text = normalize(raw);
        if (text.isEmpty()) {
            return "";
        }
        try {
            return LocalDate.parse(text, DATE_FORMATTER).format(DATE_FORMATTER);
        } catch (Exception ignored) {
            return text;
        }
    }

    private LocalDate parseDateOrDefault(String raw, LocalDate fallback) {
        String text = normalize(raw);
        if (text.isEmpty()) {
            return fallback;
        }

        try {
            return LocalDate.parse(text, DATE_FORMATTER);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private Short parseDayOfWeek(String text) {
        String normalized = text.toLowerCase(Locale.ROOT);
        if (normalized.contains("2")) {
            return 1;
        }
        if (normalized.contains("3")) {
            return 2;
        }
        if (normalized.contains("4")) {
            return 3;
        }
        if (normalized.contains("5")) {
            return 4;
        }
        if (normalized.contains("6")) {
            return 5;
        }
        if (normalized.contains("7")) {
            return 6;
        }
        return null;
    }

    private Short parsePeriod(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String digits = text.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }
        try {
            short value = Short.parseShort(digits);
            if (value >= 1 && value <= 10) {
                return value;
            }
            return null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String excelColumnName(int colIndex) {
        int index = colIndex;
        StringBuilder sb = new StringBuilder();
        while (index >= 0) {
            sb.insert(0, (char) ('A' + (index % 26)));
            index = (index / 26) - 1;
        }
        return sb.toString();
    }
}
