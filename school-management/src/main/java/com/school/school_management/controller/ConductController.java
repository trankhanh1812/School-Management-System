package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.conduct.ConductResponse;
import com.school.school_management.dto.conduct.ConductUpsertRequest;
import com.school.school_management.service.conduct.ConductService;
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
@RequestMapping("/api/conducts")
public class ConductController {

    private final ConductService conductService;

    public ConductController(ConductService conductService) {
        this.conductService = conductService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ConductResponse>>> getConducts() {
        return ResponseEntity.ok(ApiResponse.of(conductService.getConducts(), "Conduct records fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'TEACHER')")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ConductResponse>>> getMyConducts() {
        return ResponseEntity.ok(ApiResponse.of(conductService.getMyConducts(), "My conduct records fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConductResponse>> getConduct(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.of(conductService.getConduct(id), "Conduct record fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PostMapping
    public ResponseEntity<ApiResponse<ConductResponse>> createConduct(@Valid @RequestBody ConductUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(conductService.createConduct(request), "Conduct record created successfully", 201));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ConductResponse>> updateConduct(
            @PathVariable String id,
            @Valid @RequestBody ConductUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.of(conductService.updateConduct(id, request), "Conduct record updated successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConduct(@PathVariable String id) {
        conductService.deleteConduct(id);
        return ResponseEntity.ok(ApiResponse.of(null, "Conduct record deleted successfully", 200));
    }
}
