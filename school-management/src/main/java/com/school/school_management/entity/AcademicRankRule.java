package com.school.school_management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "academic_rank_rule")
public class AcademicRankRule {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "min_average", precision = 5, scale = 2)
    private BigDecimal minAverage;

    @Column(name = "max_failed_subjects")
    private Integer maxFailedSubjects;

    @Column(name = "min_conduct_level", length = 30)
    private String minConductLevel;

    @Column(name = "applies_to_grade")
    private Short appliesToGrade;
}