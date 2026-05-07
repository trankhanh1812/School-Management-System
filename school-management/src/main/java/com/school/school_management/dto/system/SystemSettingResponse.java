package com.school.school_management.dto.system;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingResponse {

    private List<String> allowedSchoolIps;
    private double oralWeight;
    private double quiz15Weight;
    private double onePeriodWeight;
    private double midtermWeight;
    private double finalWeight;
    private int scoreEditWindowDays;
    private boolean requireAdminApproval;
}
