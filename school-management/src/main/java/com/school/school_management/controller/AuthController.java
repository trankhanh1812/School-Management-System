package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.auth.ForgotPasswordRequest;
import com.school.school_management.dto.auth.LoginRequest;
import com.school.school_management.dto.auth.LoginResponse;
import com.school.school_management.dto.auth.RefreshTokenRequest;
import com.school.school_management.dto.auth.RegisterRequest;
import com.school.school_management.dto.auth.ResetPasswordRequest;
import com.school.school_management.service.auth.AuthService;
import com.school.school_management.util.DateTimeUtil;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(ApiResponse.of(authService.login(loginRequest), "Login successful", 200));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(authService.register(registerRequest), "Registration successful", 201));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        return ResponseEntity.ok(
            ApiResponse.of(authService.refreshToken(refreshTokenRequest), "Token refreshed successfully", 200)
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Object>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        String resetToken = authService.forgotPassword(forgotPasswordRequest);

        return ResponseEntity.ok(
            ApiResponse.of(
                Map.of("token", resetToken),
                "If the account exists, a reset token has been generated",
                200
            )
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        authService.resetPassword(resetPasswordRequest);
        return ResponseEntity.ok(ApiResponse.of(null, "Password reset successful", 200));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.debug("Logout request from user: {}", authentication != null ? authentication.getName() : "anonymous");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring("Bearer ".length()));
        }

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.of(null, "Logout successful", 200));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse.UserInfo>> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(ApiResponse.of(authService.getCurrentUser(email), "Current user info", 200));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Object>> health() {
        return ResponseEntity.ok(
            ApiResponse.of(
                Map.of(
                    "status", "OK",
                    "timestamp", DateTimeUtil.nowUtc().toString()
                ),
                "API is healthy",
                200
            )
        );
    }
}
