package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
public class ReportController {

    private final StudentRepository studentRepository;
    private final StudentClassRepository studentClassRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;

    public ReportController(
            StudentRepository studentRepository,
            StudentClassRepository studentClassRepository,
            SchoolClassRepository schoolClassRepository,
            TeachingAssignmentRepository teachingAssignmentRepository) {
        this.studentRepository = studentRepository;
        this.studentClassRepository = studentClassRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
    }

    /**
     * Export danh sách học sinh theo lớp ra Excel.
     * Query param: classCode (optional), academicYearCode (optional)
     */
    @GetMapping("/export/students")
    public ResponseEntity<byte[]> exportStudents(
            @RequestParam(required = false) String classCode,
            @RequestParam(required = false) String academicYearCode) throws Exception {

        List<Student> students;
        if (classCode != null && !classCode.isBlank()) {
            var schoolClass = schoolClassRepository
                .findByClassCodeAndDeletedAtIsNull(classCode.trim().toUpperCase(Locale.ROOT))
                .orElse(null);
            if (schoolClass == null) {
                students = List.of();
            } else {
                students = studentClassRepository.findBySchoolClassAndEndDateIsNull(schoolClass)
                    .stream().map(StudentClass::getStudent)
                    .filter(s -> s != null && s.getDeletedAt() == null)
                    .sorted(Comparator.comparing(Student::getStudentCode))
                    .toList();
            }
        } else {
            students = studentRepository.findAllByDeletedAtIsNullOrderByStudentCodeAsc();
        }

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Danh sách học sinh");

            // Header style
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            String[] headers = {"Mã học sinh", "Họ và tên", "Ngày sinh", "Giới tính", "Lớp", "Năm học", "Trạng thái", "Điện thoại", "Email", "Địa chỉ"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowNum = 1;
            for (Student s : students) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(safe(s.getStudentCode()));
                row.createCell(1).setCellValue(resolveFullName(s));
                row.createCell(2).setCellValue(s.getDateOfBirth() != null ? s.getDateOfBirth().toString() : "");
                row.createCell(3).setCellValue(safe(s.getGender()));
                // Current class
                var currentClass = studentClassRepository.findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(s).orElse(null);
                row.createCell(4).setCellValue(currentClass != null && currentClass.getSchoolClass() != null
                    ? safe(currentClass.getSchoolClass().getClassName()) : "");
                row.createCell(5).setCellValue(currentClass != null && currentClass.getAcademicYear() != null
                    ? safe(currentClass.getAcademicYear().getCode()) : "");
                row.createCell(6).setCellValue(safe(s.getStatus()));
                row.createCell(7).setCellValue(safe(s.getPhone()));
                row.createCell(8).setCellValue(s.getUser() != null ? safe(s.getUser().getEmail()) : "");
                row.createCell(9).setCellValue(safe(s.getAddress()));
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            byte[] bytes = out.toByteArray();

            String filename = "DanhSachHocSinh_" + LocalDate.now() + ".xlsx";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
        }
    }

    /**
     * Export danh sách phân công giảng dạy ra Excel.
     */
    @GetMapping("/export/teaching-assignments")
    public ResponseEntity<byte[]> exportTeachingAssignments(
            @RequestParam(required = false) String academicYearCode,
            @RequestParam(required = false) String semesterCode) throws Exception {

        var assignments = teachingAssignmentRepository.findAll().stream()
            .filter(a -> academicYearCode == null || academicYearCode.isBlank()
                || (a.getSemester() != null && a.getSemester().getAcademicYear() != null
                    && academicYearCode.equalsIgnoreCase(a.getSemester().getAcademicYear().getCode())))
            .filter(a -> semesterCode == null || semesterCode.isBlank()
                || (a.getSemester() != null && semesterCode.equalsIgnoreCase(a.getSemester().getCode())))
            .sorted(Comparator.comparing(a -> a.getTeacher() != null ? a.getTeacher().getTeacherCode() : ""))
            .toList();

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Phân công giảng dạy");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"Mã GV", "Tên giáo viên", "Bộ môn", "Mã lớp", "Tên lớp", "Mã môn", "Tên môn", "Học kỳ", "Năm học", "Chủ nhiệm"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowNum = 1;
            for (var a : assignments) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(a.getTeacher() != null ? safe(a.getTeacher().getTeacherCode()) : "");
                row.createCell(1).setCellValue(a.getTeacher() != null && a.getTeacher().getUser() != null
                    ? safe(a.getTeacher().getUser().getFullName()) : "");
                row.createCell(2).setCellValue(a.getTeacher() != null && a.getTeacher().getDepartment() != null
                    ? safe(a.getTeacher().getDepartment().getName()) : "");
                row.createCell(3).setCellValue(a.getSchoolClass() != null ? safe(a.getSchoolClass().getClassCode()) : "");
                row.createCell(4).setCellValue(a.getSchoolClass() != null ? safe(a.getSchoolClass().getClassName()) : "");
                row.createCell(5).setCellValue(a.getSubject() != null ? safe(a.getSubject().getCode()) : "");
                row.createCell(6).setCellValue(a.getSubject() != null ? safe(a.getSubject().getName()) : "");
                row.createCell(7).setCellValue(a.getSemester() != null ? safe(a.getSemester().getCode()) : "");
                row.createCell(8).setCellValue(a.getSemester() != null && a.getSemester().getAcademicYear() != null
                    ? safe(a.getSemester().getAcademicYear().getCode()) : "");
                row.createCell(9).setCellValue(Boolean.TRUE.equals(a.getIsHomeroom()) ? "Có" : "Không");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            byte[] bytes = out.toByteArray();

            String filename = "PhanCongGiangDay_" + LocalDate.now() + ".xlsx";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
        }
    }

    private String safe(String v) { return v != null ? v : ""; }

    private String resolveFullName(Student s) {
        if (s.getUser() != null && s.getUser().getFullName() != null && !s.getUser().getFullName().isBlank()) {
            return s.getUser().getFullName().trim();
        }
        return (safe(s.getLastName()) + " " + safe(s.getFirstName())).trim();
    }
}
