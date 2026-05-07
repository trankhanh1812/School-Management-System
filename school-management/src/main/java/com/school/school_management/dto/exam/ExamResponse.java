package com.school.school_management.dto.exam;

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
public class ExamResponse {

    private String examId;
    private String semesterCode;
    private String academicYearCode;
    private String subjectCode;
    private String subjectName;
    private String examType;
    private String examTypeLabel;
    private String assessmentGroup;
    private String title;
    private LocalDate examDate;
    private BigDecimal weight;
    private Integer editWindowDays;
    private String status;
    private List<String> classCodes;
}
