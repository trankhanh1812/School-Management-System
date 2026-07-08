package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.score.ScoreImportPreviewResponse;
import com.school.school_management.dto.score.ScoreHistoryResponse;
import com.school.school_management.dto.score.ScoreResponse;
import com.school.school_management.dto.score.ScoreUpsertRequest;
import com.school.school_management.service.score.ScoreImportService;
import com.school.school_management.service.score.ScoreService;
import jakarta.validation.Valid;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private final ScoreService scoreService;
    private final ScoreImportService scoreImportService;

    public ScoreController(ScoreService scoreService, ScoreImportService scoreImportService) {
        this.scoreService = scoreService;
        this.scoreImportService = scoreImportService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> listScores(
            @RequestParam(required = false) String examId) {
        return ResponseEntity.ok(ApiResponse.of(scoreService.listScores(examId), "Scores fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{scoreId}")
    public ResponseEntity<ApiResponse<ScoreResponse>> getScore(@PathVariable String scoreId) {
        return ResponseEntity.ok(ApiResponse.of(scoreService.getScore(scoreId), "Score fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PutMapping("/{scoreId}")
    public ResponseEntity<ApiResponse<ScoreResponse>> updateScore(
            @PathVariable String scoreId,
            @Valid @RequestBody ScoreUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(scoreService.updateScore(scoreId, request), "Score updated successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PatchMapping("/submit")
    public ResponseEntity<ApiResponse<Void>> submitScores(@RequestParam String examId) {
        scoreService.submitScores(examId);
        return ResponseEntity.ok(ApiResponse.of(null, "Scores submitted successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{scoreId}/approve")
    public ResponseEntity<ApiResponse<ScoreResponse>> approveScore(@PathVariable String scoreId) {
        return ResponseEntity.ok(ApiResponse.of(scoreService.approveScore(scoreId), "Score approved successfully", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/approve")
    public ResponseEntity<ApiResponse<Integer>> approveScores(@RequestParam String examId) {
        return ResponseEntity.ok(ApiResponse.of(scoreService.approveScores(examId), "Scores approved successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PatchMapping("/publish")
    public ResponseEntity<ApiResponse<Void>> publishScores(@RequestParam String examId) {
        scoreService.publishScores(examId);
        return ResponseEntity.ok(ApiResponse.of(null, "Scores published successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/{scoreId}/history")
    public ResponseEntity<ApiResponse<List<ScoreHistoryResponse>>> getScoreHistory(@PathVariable String scoreId) {
        return ResponseEntity.ok(ApiResponse.of(scoreService.getScoreHistory(scoreId), "Score history fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/import/template")
    public ResponseEntity<byte[]> downloadScoreImportTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("templates/Template_Import_Diem.xlsx");
            try (InputStream inputStream = resource.getInputStream(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                inputStream.transferTo(outputStream);
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header("Content-Disposition", "attachment; filename=\"Template_Import_Diem.xlsx\"")
                    .body(outputStream.toByteArray());
            }
        } catch (Exception exception) {
            throw new RuntimeException("Failed to download score import template", exception);
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ScoreImportPreviewResponse>> previewScoreImport(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.of(scoreImportService.previewImport(file), "Score import preview generated", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ScoreImportPreviewResponse>> importScores(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.of(scoreImportService.processImport(file), "Score import completed", 200));
    }
}
