package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.classroom.ClassStudentResponse;
import com.school.school_management.dto.classroom.ClassroomMetricResponse;
import com.school.school_management.dto.classroom.ClassroomResponse;
import com.school.school_management.dto.classroom.ClassroomUpsertRequest;
import com.school.school_management.dto.classroom.PromotionImportPreviewResponse;
import com.school.school_management.dto.classroom.PromotionPlanResponse;
import com.school.school_management.service.classroom.ClassroomService;
import com.school.school_management.service.classroom.PromotionImportService;
import jakarta.validation.Valid;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
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
@RequestMapping("/api/classes")
public class ClassroomController {

    private final ClassroomService classroomService;
    private final PromotionImportService promotionImportService;

    public ClassroomController(ClassroomService classroomService, PromotionImportService promotionImportService) {
        this.classroomService = classroomService;
        this.promotionImportService = promotionImportService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassroomResponse>>> getClassrooms(
            @RequestParam(required = false) String academicYearCode,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false, defaultValue = "current") String scope) {
        return ResponseEntity.ok(ApiResponse.of(
            classroomService.getClassrooms(academicYearCode, search, limit, scope),
            "Classes fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{classCode}")
    public ResponseEntity<ApiResponse<ClassroomResponse>> getClassroom(@PathVariable String classCode) {
        return ResponseEntity.ok(ApiResponse.of(classroomService.getClassroomByCode(classCode), "Class fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<ClassroomResponse>> createClassroom(@Valid @RequestBody ClassroomUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(classroomService.createClassroom(request), "Class created successfully", 201));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{classCode}")
    public ResponseEntity<ApiResponse<ClassroomResponse>> updateClassroom(
            @PathVariable String classCode,
            @Valid @RequestBody ClassroomUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(classroomService.updateClassroom(classCode, request), "Class updated successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{classCode}")
    public ResponseEntity<ApiResponse<Void>> deleteClassroom(@PathVariable String classCode) {
        classroomService.deleteClassroom(classCode);
        return ResponseEntity.ok(ApiResponse.of(null, "Class deleted successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<List<ClassroomMetricResponse>>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.of(classroomService.getMetrics(), "Class metrics fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{classCode}/students")
    public ResponseEntity<ApiResponse<List<ClassStudentResponse>>> getClassStudents(@PathVariable String classCode) {
        return ResponseEntity.ok(ApiResponse.of(classroomService.getStudentsByClassCode(classCode), "Class students fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{classCode}/promotion-plans")
    public ResponseEntity<ApiResponse<List<PromotionPlanResponse>>> getPromotionPlans(@PathVariable String classCode) {
        return ResponseEntity.ok(ApiResponse.of(classroomService.getPromotionPlansByClassCode(classCode), "Promotion plans fetched successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/promotion/import/template")
    public ResponseEntity<byte[]> downloadPromotionImportTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("templates/Template_XetLenLop.xlsx");
            try (InputStream inputStream = resource.getInputStream(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                inputStream.transferTo(outputStream);
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header("Content-Disposition", "attachment; filename=\"Template_XetLenLop.xlsx\"")
                    .body(outputStream.toByteArray());
            }
        } catch (Exception exception) {
            throw new RuntimeException("Failed to download promotion import template", exception);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/promotion/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PromotionImportPreviewResponse>> previewPromotionImport(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.of(promotionImportService.previewImport(file), "Promotion import preview generated", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/promotion/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PromotionImportPreviewResponse>> importPromotion(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.of(promotionImportService.processImport(file), "Promotion import completed", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{classCode}/promotion/auto-calculate")
    public ResponseEntity<ApiResponse<List<PromotionPlanResponse>>> autoCalculatePromotion(
            @PathVariable String classCode,
            @RequestParam(required = false) String semesterCode) {
        return ResponseEntity.ok(ApiResponse.of(
            classroomService.autoCalculatePromotion(classCode, semesterCode),
            "Auto-calculated promotion plans", 200));
    }
}
