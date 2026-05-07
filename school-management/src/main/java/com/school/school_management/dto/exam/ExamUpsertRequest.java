package com.school.school_management.dto.exam;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamUpsertRequest {

    @NotBlank
    private String semesterCode;

    @NotBlank
    private String academicYearCode;

    @NotBlank
    private String subjectCode;

    @NotBlank
    private String examType;

    @NotBlank
    private String title;

    private LocalDate examDate;

    private BigDecimal weight;

    @NotEmpty
    private List<String> classCodes;

    private String status;
}
