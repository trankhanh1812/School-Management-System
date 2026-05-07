package com.school.school_management.dto.system;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;
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
}
