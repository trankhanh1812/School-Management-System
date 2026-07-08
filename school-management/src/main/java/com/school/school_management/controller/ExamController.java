package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.exam.ExamResponse;
import com.school.school_management.dto.exam.ExamUpsertRequest;
import com.school.school_management.service.exam.ExamService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ExamResponse>>> listExams() {
        return ResponseEntity.ok(ApiResponse.of(examService.listExams(), "Exams fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN', 'TEACHER')")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getMyExams() {
        return ResponseEntity.ok(ApiResponse.of(examService.getMyExams(), "My exams fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{examId}")
    public ResponseEntity<ApiResponse<ExamResponse>> getExam(@PathVariable String examId) {
        return ResponseEntity.ok(ApiResponse.of(examService.getExam(examId), "Exam fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PostMapping
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(@Valid @RequestBody ExamUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(examService.createExam(request), "Exam created successfully", 201));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{examId}")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExam(
            @PathVariable String examId,
            @Valid @RequestBody ExamUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(examService.updateExam(examId, request), "Exam updated successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{examId}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable String examId) {
        examService.deleteExam(examId);
        return ResponseEntity.ok(ApiResponse.of(null, "Exam deleted successfully", 200));
    }
}
