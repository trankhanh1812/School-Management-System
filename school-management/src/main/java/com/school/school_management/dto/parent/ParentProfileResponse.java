package com.school.school_management.dto.parent;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response cho GET /api/parents/me/profile
 * Trả về thông tin phụ huynh + danh sách con được liên kết.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ParentProfileResponse {

    private String parentCode;
    private String fullName;
    private String phone;
    private String email;
    private List<LinkedChild> children;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LinkedChild {
        private String studentCode;
        private String fullName;
        private String className;
        private String academicYear;
        private String status;
        private String avatarLabel;
        private boolean isPrimaryContact;
        private boolean canViewScore;
    }
}
