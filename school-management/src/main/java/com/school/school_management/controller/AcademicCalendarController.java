package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.academic.AcademicYearUpsertRequest;
import com.school.school_management.dto.academic.SemesterUpsertRequest;
import com.school.school_management.service.academic.AcademicCalendarService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin management of the academic calendar (school years + semesters).
 * Reads are open to authenticated staff/portal roles; all writes are ADMIN-only.
 */
@RestController
@RequestMapping("/api/academic-calendar")
public class AcademicCalendarController {

    private final AcademicCalendarService academicCalendarService;

    public AcademicCalendarController(AcademicCalendarService academicCalendarService) {
        this.academicCalendarService = academicCalendarService;
    }

    // ── Academic years ───────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/years")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listYears() {
        return ResponseEntity.ok(ApiResponse.success(academicCalendarService.listYears(), "Academic years fetched"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/years")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upsertYear(
            @Valid @RequestBody AcademicYearUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.success(academicCalendarService.upsertYear(request), "Academic year saved"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/years/{code}/activate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> activateYear(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(academicCalendarService.activateYear(code), "Academic year activated"));
    }

    // ── Semesters ────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/semesters")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listSemesters(
            @RequestParam(required = false) String academicYearCode) {
        return ResponseEntity.ok(ApiResponse.success(
            academicCalendarService.listSemesters(academicYearCode), "Semesters fetched"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/semesters")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upsertSemester(
            @Valid @RequestBody SemesterUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.success(academicCalendarService.upsertSemester(request), "Semester saved"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/semesters/{code}/activate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> activateSemester(
            @PathVariable String code,
            @RequestParam String academicYearCode) {
        return ResponseEntity.ok(ApiResponse.success(
            academicCalendarService.activateSemester(academicYearCode, code), "Semester activated"));
    }
}
