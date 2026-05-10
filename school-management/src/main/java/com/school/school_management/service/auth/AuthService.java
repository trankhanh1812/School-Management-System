package com.school.school_management.service.auth;

import com.school.school_management.dto.auth.ForgotPasswordRequest;
import com.school.school_management.dto.auth.LoginRequest;
import com.school.school_management.dto.auth.LoginResponse;
import com.school.school_management.dto.auth.RefreshTokenRequest;
import com.school.school_management.dto.auth.RegisterRequest;
import com.school.school_management.dto.auth.ResetPasswordRequest;

public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    LoginResponse register(RegisterRequest registerRequest);

    LoginResponse refreshToken(RefreshTokenRequest refreshTokenRequest);

    LoginResponse.UserInfo getCurrentUser(String email);

    String forgotPassword(ForgotPasswordRequest forgotPasswordRequest);

    void resetPassword(ResetPasswordRequest resetPasswordRequest);

    void logout(String token);

    /**
     * Đổi mật khẩu lần đầu đăng nhập (khi forcePasswordChange = true).
     * Sau khi đổi thành công, forcePasswordChange được set về false.
     */
    void changePasswordFirstLogin(String currentUserEmail, String newPassword);
}
