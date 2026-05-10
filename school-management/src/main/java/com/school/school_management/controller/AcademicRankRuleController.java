package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.entity.AcademicRankRule;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.AcademicRankRuleRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@RestController
@RequestMapping("/api/academic-rank-rules")
public class AcademicRankRuleController {

    private final AcademicRankRuleRepository repository;

    public AcademicRankRuleController(AcademicRankRuleRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
        var result = repository.findAllByOrderByCodeAsc().stream()
            .map(this::toMap)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(result, "Academic rank rules fetched"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @Valid @RequestBody RuleRequest request) {
        if (repository.findAllByOrderByCodeAsc().stream()
                .anyMatch(r -> request.getCode().equalsIgnoreCase(r.getCode()))) {
            throw new CustomException("Rule code already exists", 409);
        }
        AcademicRankRule rule = AcademicRankRule.builder()
            .code(request.getCode().trim().toUpperCase())
            .name(request.getName().trim())
            .minAverage(request.getMinAverage())
            .maxFailedSubjects(request.getMaxFailedSubjects())
            .minConductLevel(request.getMinConductLevel())
            .appliesToGrade(request.getAppliesToGrade())
            .build();
        AcademicRankRule saved = repository.save(rule);
        log.info("Academic rank rule created: {}", saved.getCode());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(toMap(saved), "Rule created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(
            @PathVariable String id,
            @Valid @RequestBody RuleRequest request) {
        AcademicRankRule rule = repository.findById(parseUuid(id))
            .orElseThrow(() -> new CustomException("Rule not found", 404));
        rule.setCode(request.getCode().trim().toUpperCase());
        rule.setName(request.getName().trim());
        rule.setMinAverage(request.getMinAverage());
        rule.setMaxFailedSubjects(request.getMaxFailedSubjects());
        rule.setMinConductLevel(request.getMinConductLevel());
        rule.setAppliesToGrade(request.getAppliesToGrade());
        AcademicRankRule saved = repository.save(rule);
        return ResponseEntity.ok(ApiResponse.success(toMap(saved), "Rule updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        AcademicRankRule rule = repository.findById(parseUuid(id))
            .orElseThrow(() -> new CustomException("Rule not found", 404));
        repository.delete(rule);
        return ResponseEntity.ok(ApiResponse.success(null, "Rule deleted"));
    }

    private Map<String, Object> toMap(AcademicRankRule r) {
        return Map.of(
            "id", r.getId() != null ? r.getId().toString() : "",
            "code", r.getCode() != null ? r.getCode() : "",
            "name", r.getName() != null ? r.getName() : "",
            "minAverage", r.getMinAverage() != null ? r.getMinAverage() : BigDecimal.ZERO,
            "maxFailedSubjects", r.getMaxFailedSubjects() != null ? r.getMaxFailedSubjects() : 0,
            "minConductLevel", r.getMinConductLevel() != null ? r.getMinConductLevel() : "",
            "appliesToGrade", r.getAppliesToGrade() != null ? r.getAppliesToGrade() : 0
        );
    }

    private UUID parseUuid(String value) {
        try { return UUID.fromString(value.trim()); }
        catch (IllegalArgumentException e) { throw new CustomException("Invalid ID", 400); }
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RuleRequest {
        @NotBlank private String code;
        @NotBlank private String name;
        @NotNull  private BigDecimal minAverage;
        private Integer maxFailedSubjects;
        private String minConductLevel;
        private Short appliesToGrade;
    }
}
