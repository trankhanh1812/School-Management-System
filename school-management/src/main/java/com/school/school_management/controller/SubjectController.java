package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.subject.SubjectMetricResponse;
import com.school.school_management.dto.subject.SubjectResponse;
import com.school.school_management.dto.subject.SubjectUpsertRequest;
import com.school.school_management.service.subject.SubjectService;
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
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getSubjects() {
        return ResponseEntity.ok(ApiResponse.of(subjectService.getSubjects(), "Subjects fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{subjectCode}")
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubject(@PathVariable String subjectCode) {
        return ResponseEntity.ok(ApiResponse.of(subjectService.getSubjectByCode(subjectCode), "Subject fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(@Valid @RequestBody SubjectUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(subjectService.createSubject(request), "Subject created successfully", 201));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{subjectCode}")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @PathVariable String subjectCode,
            @Valid @RequestBody SubjectUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(subjectService.updateSubject(subjectCode, request), "Subject updated successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{subjectCode}")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable String subjectCode) {
        subjectService.deleteSubject(subjectCode);
        return ResponseEntity.ok(ApiResponse.of(null, "Subject deleted successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<SubjectMetricResponse>>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.of(subjectService.getMetrics(), "Subject metrics fetched successfully", 200));
    }
}
