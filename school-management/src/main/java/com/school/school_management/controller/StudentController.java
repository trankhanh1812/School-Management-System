package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.student.BulkImportResponse;
import com.school.school_management.dto.student.StudentImportPreviewResponse;
import com.school.school_management.dto.student.StudentResponse;
import com.school.school_management.dto.student.StudentTranscriptResponse;
import com.school.school_management.dto.student.StudentUpsertRequest;
import com.school.school_management.dto.student.PromotionHistoryResponse;
import com.school.school_management.dto.student.ScoreHistoryResponse;
import com.school.school_management.service.student.ImportService;
import com.school.school_management.service.student.StudentService;
import com.school.school_management.util.ExcelImportUtil;
import jakarta.validation.Valid;
import java.io.ByteArrayInputStream;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final ImportService importService;
    private final ExcelImportUtil excelImportUtil;

    public StudentController(
        StudentService studentService,
        ImportService importService,
        ExcelImportUtil excelImportUtil
    ) {
        this.studentService = studentService;
        this.importService = importService;
        this.excelImportUtil = excelImportUtil;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentResponse>>> getStudents(
            @RequestParam(required = false) String academicYearCode,
            @RequestParam(required = false) String classQuery,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false, defaultValue = "current") String scope) {
        return ResponseEntity.ok(ApiResponse.of(
            studentService.getStudents(academicYearCode, classQuery, status, search, limit, scope),
            "Students fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{studentCode}")
    public ResponseEntity<ApiResponse<StudentResponse>> getStudent(@PathVariable String studentCode) {
        return ResponseEntity.ok(ApiResponse.of(studentService.getStudentByCode(studentCode), "Student fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{studentCode}/scores")
    public ResponseEntity<ApiResponse<List<StudentResponse.SubjectResultItem>>> getStudentScores(
            @PathVariable String studentCode) {
        return ResponseEntity.ok(ApiResponse.of(studentService.getStudentScores(studentCode), "Student scores fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{studentCode}/transcript")
    public ResponseEntity<ApiResponse<StudentTranscriptResponse>> getStudentTranscript(@PathVariable String studentCode) {
        return ResponseEntity.ok(ApiResponse.of(studentService.getStudentTranscript(studentCode), "Student transcript fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/me/profile")
    public ResponseEntity<ApiResponse<StudentResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.of(studentService.getMyProfile(), "My student profile fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/me/scores")
    public ResponseEntity<ApiResponse<List<StudentResponse.SubjectResultItem>>> getMyScores() {
        return ResponseEntity.ok(ApiResponse.of(studentService.getMyScores(), "My scores fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/me/transcript")
    public ResponseEntity<ApiResponse<StudentTranscriptResponse>> getMyTranscript() {
        return ResponseEntity.ok(ApiResponse.of(studentService.getMyTranscript(), "My transcript fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<StudentResponse>> createStudent(
            @Valid @RequestBody StudentUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(studentService.createStudent(request), "Student created successfully", 201));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PutMapping("/{studentCode}")
    public ResponseEntity<ApiResponse<StudentResponse>> updateStudent(
            @PathVariable String studentCode,
            @Valid @RequestBody StudentUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(studentService.updateStudent(studentCode, request), "Student updated successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{studentCode}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable String studentCode) {
        studentService.deleteStudent(studentCode);
        return ResponseEntity.ok(ApiResponse.of(null, "Student deleted successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/import/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        ByteArrayInputStream template = excelImportUtil.generateTemplate();
        try {
            byte[] bytes = template.readAllBytes();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header("Content-Disposition", "attachment; filename=\"student_import_template.xlsx\"")
                .body(bytes);
        } catch (Exception e) {
            throw new RuntimeException("Error generating template", e);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<StudentImportPreviewResponse>> previewImport(
            @RequestParam("file") MultipartFile file) {
        StudentImportPreviewResponse response = importService.getImportPreview(file);
        return ResponseEntity.ok(ApiResponse.of(response, "Import preview generated successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<BulkImportResponse>> importStudents(
            @RequestParam("file") MultipartFile file) {
        BulkImportResponse response = importService.processBulkImport(file);
        return ResponseEntity.ok(ApiResponse.of(response, "Import processed successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/import/errors/{importId}")
    public ResponseEntity<byte[]> downloadErrorReport(@PathVariable String importId) {
        byte[] errorReport = importService.getErrorReport(importId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header("Content-Disposition", "attachment; filename=\"import_errors.xlsx\"")
            .body(errorReport);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{studentCode}/promotion-history")
    public ResponseEntity<ApiResponse<PromotionHistoryResponse>> getPromotionHistory(@PathVariable String studentCode) {
        return ResponseEntity.ok(ApiResponse.of(
            studentService.getPromotionHistory(studentCode),
            "Promotion history fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{studentCode}/score-history")
    public ResponseEntity<ApiResponse<ScoreHistoryResponse>> getScoreHistory(@PathVariable String studentCode) {
        return ResponseEntity.ok(ApiResponse.of(
            studentService.getScoreHistory(studentCode),
            "Score history fetched successfully",
            200
        ));
    }
}
