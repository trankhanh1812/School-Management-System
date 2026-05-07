package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.academic.AcademicYearOptionResponse;
import com.school.school_management.repository.AcademicYearRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/academic-years")
public class AcademicYearController {

    private final AcademicYearRepository academicYearRepository;

    public AcademicYearController(AcademicYearRepository academicYearRepository) {
        this.academicYearRepository = academicYearRepository;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<AcademicYearOptionResponse>>> listAcademicYears() {
        List<AcademicYearOptionResponse> items = academicYearRepository
            .findAll(Sort.by(Sort.Direction.DESC, "startDate"))
            .stream()
            .map(year -> AcademicYearOptionResponse.builder()
                .id(year.getId() != null ? year.getId().toString() : "")
                .code(year.getCode())
                .status(year.getStatus())
                .build())
            .toList();

        return ResponseEntity.ok(ApiResponse.of(items, "Academic years fetched successfully", 200));
    }
}
