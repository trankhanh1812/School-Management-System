package com.school.school_management.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoginRequest - DTO for user login.
 *
 * Accepts either username (CCCD, phone, studentCode) or email.
 * Example:
 * {
 *   "username": "012345678901",
 *   "password": "secure_password_123"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Tên người dùng là bắt buộc")
    private String username;

    @NotBlank(message = "Mật khẩu là bắt buộc")
    private String password;

    /**
     * Backward-compat: nếu client gửi "email" thay vì "username",
     * vẫn hoạt động bình thường.
     */
    public String getEffectiveUsername() {
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        return null;
    }
}
