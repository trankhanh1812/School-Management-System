package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.teaching.TeachingAssignmentResponse;
import com.school.school_management.dto.teaching.TeachingAssignmentUpsertRequest;
import com.school.school_management.dto.teaching.TeachingConflictCheckRequest;
import com.school.school_management.dto.teaching.TeachingConflictCheckResponse;
import com.school.school_management.dto.teaching.TeachingMetricResponse;
import com.school.school_management.dto.teaching.TimetableEntryResponse;
import com.school.school_management.dto.teaching.TimetableGridUpsertRequest;
import com.school.school_management.dto.teaching.TimetableImportPreviewResponse;
import com.school.school_management.dto.teaching.TimetableVersionResponse;
import com.school.school_management.service.teaching.TeachingService;
import com.school.school_management.service.teaching.TimetableImportService;
import jakarta.validation.Valid;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
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
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/teaching-assignments")
public class TeachingController {

    private final TeachingService teachingService;
    private final TimetableImportService timetableImportService;

    public TeachingController(TeachingService teachingService, TimetableImportService timetableImportService) {
        this.teachingService = teachingService;
        this.timetableImportService = timetableImportService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TeachingAssignmentResponse>>> getTeachingAssignments() {
        return ResponseEntity.ok(ApiResponse.of(teachingService.getTeachingAssignments(), "Teaching assignments fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{assignmentId}")
    public ResponseEntity<ApiResponse<TeachingAssignmentResponse>> getTeachingAssignment(@PathVariable String assignmentId) {
        return ResponseEntity.ok(ApiResponse.of(teachingService.getTeachingAssignment(assignmentId), "Teaching assignment fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/by-department")
    public ResponseEntity<ApiResponse<List<TeachingAssignmentResponse>>> getTeachingAssignmentsByDepartmentParam(
            @RequestParam String departmentCode) {
        return ResponseEntity.ok(ApiResponse.of(teachingService.getTeachingAssignmentsByDepartment(departmentCode), "Department teaching assignments fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/by-department/{departmentCode}")
    public ResponseEntity<ApiResponse<List<TeachingAssignmentResponse>>> getTeachingAssignmentsByDepartment(
            @PathVariable String departmentCode) {
        return ResponseEntity.ok(ApiResponse.of(teachingService.getTeachingAssignmentsByDepartment(departmentCode), "Department teaching assignments fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<TeachingAssignmentResponse>>> getMyTeachingAssignments(
            @RequestParam(required = false) String academicYearId) {
        return ResponseEntity.ok(ApiResponse.of(teachingService.getTeachingAssignmentsByCurrentUser(academicYearId), "User teaching assignments fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/by-subject/{subjectCode}")
    public ResponseEntity<ApiResponse<List<TeachingAssignmentResponse>>> getTeachingAssignmentsBySubject(
            @PathVariable String subjectCode,
            @RequestParam(required = false) String semesterCode,
            @RequestParam(required = false) String academicYearCode,
            @RequestParam(required = false) String gradeLevel) {
        return ResponseEntity.ok(ApiResponse.of(
            teachingService.getTeachingAssignmentsBySubject(subjectCode, semesterCode, academicYearCode, gradeLevel),
            "Subject teaching assignments fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PostMapping
    public ResponseEntity<ApiResponse<TeachingAssignmentResponse>> createTeachingAssignment(
            @Valid @RequestBody TeachingAssignmentUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(teachingService.createTeachingAssignment(request), "Teaching assignment created successfully", 201));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PostMapping("/check-conflicts")
    public ResponseEntity<ApiResponse<TeachingConflictCheckResponse>> checkConflicts(
            @Valid @RequestBody TeachingConflictCheckRequest request) {
        return ResponseEntity.ok(ApiResponse.of(teachingService.checkConflicts(request), "Conflict check completed", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/timetable")
    public ResponseEntity<ApiResponse<List<TimetableEntryResponse>>> getTimetable(
            @RequestParam String semesterCode,
            @RequestParam String academicYearCode,
            @RequestParam(required = false) String versionId) {
        return ResponseEntity.ok(ApiResponse.of(
            teachingService.getTimetableGrid(semesterCode, academicYearCode, versionId),
            "Timetable fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/timetable/versions")
    public ResponseEntity<ApiResponse<List<TimetableVersionResponse>>> getTimetableVersions(
            @RequestParam String semesterCode,
            @RequestParam String academicYearCode) {
        return ResponseEntity.ok(ApiResponse.of(
            teachingService.getTimetableVersions(semesterCode, academicYearCode),
            "Timetable versions fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/timetable")
    public ResponseEntity<ApiResponse<Void>> upsertTimetable(@Valid @RequestBody TimetableGridUpsertRequest request) {
        teachingService.upsertTimetableGrid(request);
        return ResponseEntity.ok(ApiResponse.of(null, "Timetable saved successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/timetable/import/template")
    public ResponseEntity<byte[]> downloadTimetableImportTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("templates/TKB_Template_36lop.xlsx");
            try (InputStream inputStream = resource.getInputStream(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                inputStream.transferTo(outputStream);
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header("Content-Disposition", "attachment; filename=\"TKB_Template_36lop.xlsx\"")
                    .body(outputStream.toByteArray());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to download timetable import template", e);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/timetable/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TimetableImportPreviewResponse>> previewTimetableImport(
        @RequestParam("file") MultipartFile file
    ) {
        TimetableImportPreviewResponse response = timetableImportService.previewImport(file);
        return ResponseEntity.ok(ApiResponse.of(response, "Timetable import preview generated", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/timetable/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TimetableImportPreviewResponse>> importTimetable(
        @RequestParam("file") MultipartFile file
    ) {
        TimetableImportPreviewResponse response = timetableImportService.processImport(file);
        return ResponseEntity.ok(ApiResponse.of(response, "Timetable import completed", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PutMapping("/{assignmentId}")
    public ResponseEntity<ApiResponse<TeachingAssignmentResponse>> updateTeachingAssignment(
            @PathVariable String assignmentId,
            @Valid @RequestBody TeachingAssignmentUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(teachingService.updateTeachingAssignment(assignmentId, request), "Teaching assignment updated successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteTeachingAssignment(@PathVariable String assignmentId) {
        teachingService.deleteTeachingAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.of(null, "Teaching assignment deleted successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<TeachingMetricResponse>>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.of(teachingService.getMetrics(), "Teaching metrics fetched successfully", 200));
    }
}
