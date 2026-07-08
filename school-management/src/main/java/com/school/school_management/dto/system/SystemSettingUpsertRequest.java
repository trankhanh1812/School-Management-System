package com.school.school_management.dto.system;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingUpsertRequest {

    @NotNull
    private List<String> allowedSchoolIps;

    @Min(0)
    @Max(10)
    private double oralWeight;

    @Min(0)
    @Max(10)
    private double quiz15Weight;

    @Min(0)
    @Max(10)
    private double onePeriodWeight;

    @Min(0)
    @Max(10)
    private double midtermWeight;

    @Min(0)
    @Max(10)
    private double finalWeight;

    @Min(0)
    @Max(90)
    private int scoreEditWindowDays;

    private boolean requireAdminApproval;

    // ── Chính sách xét lên lớp (nullable; service áp mặc định nếu thiếu) ──
    @Min(0)
    @Max(10)
    private Double passMark;

    @Min(0)
    @Max(10)
    private Double failingSubjectMark;

    @Min(0)
    @Max(30)
    private Integer maxFailedSubjectsToPromote;

    @Min(1)
    @Max(12)
    private Integer graduationGradeLevel;
}
