package com.school.school_management.dto.auth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private UserInfo user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private UUID id;
        private String email;
        private String fullName;
        private String role;
        private List<String> roles;
        private boolean active;
        private OffsetDateTime createdAt;

        // Department info for TEACHER role
        private Integer departmentLevel;
        private String departmentCode;
        private String departmentName;

        /** Khi true, user phải đổi mật khẩu trước khi vào dashboard */
        private boolean forcePasswordChange;
    }
}
