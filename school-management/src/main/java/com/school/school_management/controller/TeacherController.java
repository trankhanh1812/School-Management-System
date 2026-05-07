package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.teacher.AvailableHomeroomTeacherResponse;
import com.school.school_management.dto.teacher.TeacherDepartmentResponse;
import com.school.school_management.dto.teacher.TeacherMetricResponse;
import com.school.school_management.dto.teacher.TeacherResponse;
import com.school.school_management.dto.teacher.TeacherUpsertRequest;
import jakarta.validation.Valid;
import com.school.school_management.service.teacher.TeacherService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherResponse>>> getTeachers(
            @RequestParam(required = false) String departmentQuery,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(ApiResponse.of(
            teacherService.getTeachers(departmentQuery, search, limit),
            "Teachers fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{teacherCode}")
    public ResponseEntity<ApiResponse<TeacherResponse>> getTeacher(@PathVariable String teacherCode) {
        return ResponseEntity.ok(ApiResponse.of(teacherService.getTeacherByCode(teacherCode), "Teacher fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<TeacherResponse>> createTeacher(@Valid @RequestBody TeacherUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(teacherService.createTeacher(request), "Teacher created successfully", 201));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{teacherCode}")
    public ResponseEntity<ApiResponse<TeacherResponse>> updateTeacher(
            @PathVariable String teacherCode,
            @Valid @RequestBody TeacherUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(teacherService.updateTeacher(teacherCode, request), "Teacher updated successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{teacherCode}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable String teacherCode) {
        teacherService.deleteTeacher(teacherCode);
        return ResponseEntity.ok(ApiResponse.of(null, "Teacher deleted successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<TeacherDepartmentResponse>>> getDepartments() {
        return ResponseEntity.ok(ApiResponse.of(teacherService.getDepartments(), "Teacher departments fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/available-homeroom")
    public ResponseEntity<ApiResponse<List<AvailableHomeroomTeacherResponse>>> getAvailableHomeroomTeachers() {
        return ResponseEntity.ok(ApiResponse.of(teacherService.getAvailableHomeroomTeachers(), "Available homeroom teachers fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<TeacherMetricResponse>>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.of(teacherService.getMetrics(), "Teacher metrics fetched successfully", 200));
    }
}
