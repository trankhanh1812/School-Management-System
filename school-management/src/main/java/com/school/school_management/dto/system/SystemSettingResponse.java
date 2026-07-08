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

    // ── Chính sách xét lên lớp (nullable để tương thích file cấu hình cũ) ──
    /** Điểm trung bình tối thiểu để lên lớp / tốt nghiệp. Mặc định 5.0. */
    private Double passMark;
    /** Điểm dưới mức này bị coi là trượt môn. Mặc định 5.0. */
    private Double failingSubjectMark;
    /** Số môn trượt tối đa vẫn được xét lên lớp. Mặc định 2. */
    private Integer maxFailedSubjectsToPromote;
    /** Khối được xét tốt nghiệp (thay vì lên lớp). Mặc định 12. */
    private Integer graduationGradeLevel;
}
